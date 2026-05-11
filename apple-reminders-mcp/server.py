"""MCP server for Apple Reminders on macOS.

Two backends:

* **AppleScript** (default) — invokes `osascript` against the .applescript files
  in ./applescripts/. Works out of the box on any macOS.
* **EventKit** — if `eventkit/reminders` (compiled Swift CLI) exists and is
  executable, it is used instead. Richer metadata (recurrence, alarms).

Select with env var: APPLE_REMINDERS_BACKEND=applescript|eventkit (default: auto).
"""
from __future__ import annotations

import asyncio
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

ROOT = Path(__file__).resolve().parent
APPLESCRIPTS = ROOT / "applescripts"
EVENTKIT_BIN = ROOT / "eventkit" / "reminders"

RS = "\x1e"
US = "\x1f"

PRIORITY_MAP = {0: "none", 1: "high", 5: "medium", 9: "low"}
PRIORITY_REVERSE = {"none": 0, "high": 1, "medium": 5, "low": 9}


def _backend() -> str:
    choice = os.environ.get("APPLE_REMINDERS_BACKEND", "auto").lower()
    if choice == "eventkit":
        return "eventkit"
    if choice == "applescript":
        return "applescript"
    return "eventkit" if EVENTKIT_BIN.exists() and os.access(EVENTKIT_BIN, os.X_OK) else "applescript"


# ---------- AppleScript backend ----------

def _run_applescript(name: str, *args: str) -> str:
    script = APPLESCRIPTS / f"{name}.applescript"
    if not script.exists():
        raise FileNotFoundError(f"missing applescript: {script}")
    proc = subprocess.run(
        ["osascript", str(script), *args],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"osascript {name} failed: {proc.stderr.strip()}")
    return proc.stdout.rstrip("\n")


def _parse_records(raw: str, fields: list[str]) -> list[dict[str, str]]:
    if not raw:
        return []
    out = []
    for rec in raw.split(RS):
        rec = rec.strip()
        if not rec:
            continue
        parts = rec.split(US)
        while len(parts) < len(fields):
            parts.append("")
        out.append(dict(zip(fields, parts)))
    return out


def _to_iso(applescript_date: str) -> str | None:
    if not applescript_date or applescript_date == "missing value":
        return None
    for fmt in (
        "%A, %B %d, %Y at %I:%M:%S %p",
        "%A, %B %d, %Y at %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            return datetime.strptime(applescript_date, fmt).isoformat()
        except ValueError:
            continue
    return applescript_date


def _format_applescript_reminder(rec: dict[str, str]) -> dict[str, Any]:
    prio_raw = rec.get("priority") or "0"
    try:
        prio_int = int(prio_raw)
    except ValueError:
        prio_int = 0
    return {
        "id": rec.get("id", ""),
        "title": rec.get("title", ""),
        "notes": rec.get("body", ""),
        "completed": rec.get("done", "false") == "true",
        "due": _to_iso(rec.get("due", "")),
        "priority": PRIORITY_MAP.get(prio_int, "none"),
        "list": rec.get("list", ""),
    }


def as_list_lists() -> list[dict[str, str]]:
    raw = _run_applescript("list_lists")
    return _parse_records(raw, ["id", "name"])


def as_list_reminders(
    list_name: str | None,
    include_completed: bool,
    query: str | None,
    due_before: str | None,
) -> list[dict[str, Any]]:
    raw = _run_applescript(
        "list_reminders",
        list_name or "",
        "true" if include_completed else "false",
    )
    fields = ["id", "title", "body", "done", "due", "priority", "list"]
    items = [_format_applescript_reminder(r) for r in _parse_records(raw, fields)]
    if query:
        q = query.lower()
        items = [
            x for x in items
            if q in (x["title"] or "").lower() or q in (x["notes"] or "").lower()
        ]
    if due_before:
        cutoff = datetime.fromisoformat(due_before)
        items = [
            x for x in items
            if x["due"] and datetime.fromisoformat(x["due"]) < cutoff
        ]
    return items


def as_get_reminder(reminder_id: str) -> dict[str, Any]:
    raw = _run_applescript("get_reminder", reminder_id)
    fields = ["id", "title", "body", "done", "due", "priority", "list"]
    recs = _parse_records(raw + RS, fields)
    if not recs:
        raise ValueError(f"reminder {reminder_id} not found")
    return _format_applescript_reminder(recs[0])


def as_create_reminder(
    title: str,
    list_name: str | None,
    notes: str | None,
    due: str | None,
    priority: str,
) -> dict[str, str]:
    args = [
        title,
        list_name or "",
        notes or "",
        due or "",
        str(PRIORITY_REVERSE.get(priority, 0)),
    ]
    new_id = _run_applescript("create_reminder", *args)
    return {"id": new_id, "status": "created"}


def as_complete_reminder(reminder_id: str) -> dict[str, str]:
    _run_applescript("complete_reminder", reminder_id)
    return {"id": reminder_id, "status": "completed"}


def as_update_reminder(
    reminder_id: str,
    title: str | None,
    notes: str | None,
    due: str | None,
    priority: str | None,
) -> dict[str, str]:
    args = [
        reminder_id,
        title if title is not None else "-",
        notes if notes is not None else "-",
        due if due is not None else "-",
        str(PRIORITY_REVERSE[priority]) if priority in PRIORITY_REVERSE else "-",
    ]
    _run_applescript("update_reminder", *args)
    return {"id": reminder_id, "status": "updated"}


def as_delete_reminder(reminder_id: str) -> dict[str, str]:
    _run_applescript("delete_reminder", reminder_id)
    return {"id": reminder_id, "status": "deleted"}


# ---------- EventKit backend ----------

def _run_eventkit(*args: str) -> Any:
    proc = subprocess.run(
        [str(EVENTKIT_BIN), *args],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"eventkit failed: {proc.stderr.strip()}")
    return json.loads(proc.stdout) if proc.stdout.strip() else None


def ek_list_lists() -> Any:
    return _run_eventkit("list-lists")


def ek_list_reminders(
    list_name: str | None,
    include_completed: bool,
    query: str | None,
    due_before: str | None,
) -> Any:
    args = ["list-reminders"]
    if list_name:
        args += ["--list", list_name]
    if include_completed:
        args.append("--include-completed")
    if query:
        args += ["--query", query]
    if due_before:
        args += ["--due-before", due_before]
    return _run_eventkit(*args)


def ek_get_reminder(reminder_id: str) -> Any:
    return _run_eventkit("get-reminder", reminder_id)


def ek_create_reminder(
    title: str,
    list_name: str | None,
    notes: str | None,
    due: str | None,
    priority: str,
) -> Any:
    args = ["create-reminder", "--title", title, "--priority", priority]
    if list_name: args += ["--list", list_name]
    if notes:     args += ["--notes", notes]
    if due:       args += ["--due", due]
    return _run_eventkit(*args)


def ek_complete_reminder(reminder_id: str) -> Any:
    return _run_eventkit("complete-reminder", reminder_id)


def ek_update_reminder(
    reminder_id: str,
    title: str | None,
    notes: str | None,
    due: str | None,
    priority: str | None,
) -> Any:
    args = ["update-reminder", reminder_id]
    if title is not None:    args += ["--title", title]
    if notes is not None:    args += ["--notes", notes]
    if due is not None:      args += ["--due", due]
    if priority is not None: args += ["--priority", priority]
    return _run_eventkit(*args)


def ek_delete_reminder(reminder_id: str) -> Any:
    return _run_eventkit("delete-reminder", reminder_id)


# ---------- Dispatch ----------

def dispatch(name: str, arguments: dict[str, Any]) -> Any:
    backend = _backend()
    if backend == "eventkit":
        table = {
            "list_lists":        lambda: ek_list_lists(),
            "list_reminders":    lambda: ek_list_reminders(
                arguments.get("list_name"),
                arguments.get("include_completed", False),
                arguments.get("query"),
                arguments.get("due_before"),
            ),
            "get_reminder":      lambda: ek_get_reminder(arguments["id"]),
            "create_reminder":   lambda: ek_create_reminder(
                arguments["title"],
                arguments.get("list_name"),
                arguments.get("notes"),
                arguments.get("due"),
                arguments.get("priority", "none"),
            ),
            "complete_reminder": lambda: ek_complete_reminder(arguments["id"]),
            "update_reminder":   lambda: ek_update_reminder(
                arguments["id"],
                arguments.get("title"),
                arguments.get("notes"),
                arguments.get("due"),
                arguments.get("priority"),
            ),
            "delete_reminder":   lambda: ek_delete_reminder(arguments["id"]),
        }
    else:
        table = {
            "list_lists":        lambda: as_list_lists(),
            "list_reminders":    lambda: as_list_reminders(
                arguments.get("list_name"),
                arguments.get("include_completed", False),
                arguments.get("query"),
                arguments.get("due_before"),
            ),
            "get_reminder":      lambda: as_get_reminder(arguments["id"]),
            "create_reminder":   lambda: as_create_reminder(
                arguments["title"],
                arguments.get("list_name"),
                arguments.get("notes"),
                arguments.get("due"),
                arguments.get("priority", "none"),
            ),
            "complete_reminder": lambda: as_complete_reminder(arguments["id"]),
            "update_reminder":   lambda: as_update_reminder(
                arguments["id"],
                arguments.get("title"),
                arguments.get("notes"),
                arguments.get("due"),
                arguments.get("priority"),
            ),
            "delete_reminder":   lambda: as_delete_reminder(arguments["id"]),
        }
    if name not in table:
        raise ValueError(f"unknown tool: {name}")
    return table[name]()


# ---------- MCP wiring ----------

server: Server = Server("apple-reminders")

TOOLS: list[Tool] = [
    Tool(
        name="list_lists",
        description="List all Reminder lists (Inbox + custom lists) with their IDs and names.",
        inputSchema={"type": "object", "properties": {}, "required": []},
    ),
    Tool(
        name="list_reminders",
        description=(
            "List reminders, optionally filtered by list name, completion state, "
            "keyword in title/notes, and a due-before cutoff (ISO 8601)."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "list_name": {"type": "string"},
                "include_completed": {"type": "boolean", "default": False},
                "query": {"type": "string"},
                "due_before": {
                    "type": "string",
                    "description": "ISO 8601 datetime; only items due strictly before this are returned.",
                },
            },
        },
    ),
    Tool(
        name="get_reminder",
        description="Get a single reminder by its ID.",
        inputSchema={
            "type": "object",
            "properties": {"id": {"type": "string"}},
            "required": ["id"],
        },
    ),
    Tool(
        name="create_reminder",
        description="Create a new reminder.",
        inputSchema={
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "list_name": {"type": "string"},
                "notes": {"type": "string"},
                "due": {"type": "string", "description": "ISO 8601 datetime."},
                "priority": {
                    "type": "string",
                    "enum": ["none", "low", "medium", "high"],
                    "default": "none",
                },
            },
            "required": ["title"],
        },
    ),
    Tool(
        name="complete_reminder",
        description="Mark a reminder as completed.",
        inputSchema={
            "type": "object",
            "properties": {"id": {"type": "string"}},
            "required": ["id"],
        },
    ),
    Tool(
        name="update_reminder",
        description="Update fields of an existing reminder. Only provided fields change.",
        inputSchema={
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "title": {"type": "string"},
                "notes": {"type": "string"},
                "due": {"type": "string"},
                "priority": {
                    "type": "string",
                    "enum": ["none", "low", "medium", "high"],
                },
            },
            "required": ["id"],
        },
    ),
    Tool(
        name="delete_reminder",
        description="Delete a reminder by ID. Irreversible.",
        inputSchema={
            "type": "object",
            "properties": {"id": {"type": "string"}},
            "required": ["id"],
        },
    ),
]


@server.list_tools()
async def list_tools() -> list[Tool]:
    return TOOLS


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        result = dispatch(name, arguments)
        return [TextContent(type="text", text=json.dumps(result, indent=2, default=str))]
    except Exception as e:
        return [TextContent(type="text", text=json.dumps({"error": str(e)}))]


async def _run() -> None:
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


def main() -> None:
    if sys.platform != "darwin":
        print(
            "apple-reminders-mcp must run on macOS (uses osascript / EventKit).",
            file=sys.stderr,
        )
        sys.exit(1)
    asyncio.run(_run())


if __name__ == "__main__":
    main()
