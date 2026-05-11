"""MCP server for Apple Reminders on macOS.

Communicates with the Reminders.app via `osascript`. Must run on macOS with
Reminders access granted to the terminal/process invoking it.
"""
from __future__ import annotations

import asyncio
import json
import subprocess
import sys
from datetime import datetime
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

RS = "\x1e"
US = "\x1f"

PRIORITY_MAP = {0: "none", 1: "high", 5: "medium", 9: "low"}
PRIORITY_REVERSE = {"none": 0, "high": 1, "medium": 5, "low": 9}


def _osascript(script: str) -> str:
    proc = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"osascript failed: {proc.stderr.strip()}")
    return proc.stdout.rstrip("\n")


def _parse_records(raw: str, fields: list[str]) -> list[dict[str, Any]]:
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
    for fmt in ("%A, %B %d, %Y at %I:%M:%S %p", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(applescript_date, fmt).isoformat()
        except ValueError:
            continue
    return applescript_date


def _escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


# ---------- AppleScript snippets ----------

LIST_LISTS = f'''
tell application "Reminders"
  set out to ""
  repeat with L in lists
    set out to out & (id of L) & "{US}" & (name of L) & "{RS}"
  end repeat
  return out
end tell
'''


def list_reminders_script(
    list_name: str | None,
    include_completed: bool,
) -> str:
    target = (
        f'reminders of list "{_escape(list_name)}"'
        if list_name
        else "reminders"
    )
    completed_filter = "" if include_completed else " whose completed is false"
    return f'''
tell application "Reminders"
  set out to ""
  set theItems to ({target}{completed_filter})
  repeat with r in theItems
    set rid to id of r
    set rname to name of r
    try
      set rbody to body of r
    on error
      set rbody to ""
    end try
    set rdone to (completed of r) as text
    try
      set rdue to (due date of r) as text
    on error
      set rdue to ""
    end try
    try
      set rprio to (priority of r) as text
    on error
      set rprio to "0"
    end try
    set rlist to name of container of r
    set out to out & rid & "{US}" & rname & "{US}" & rbody & "{US}" & rdone & "{US}" & rdue & "{US}" & rprio & "{US}" & rlist & "{RS}"
  end repeat
  return out
end tell
'''


def get_reminder_script(reminder_id: str) -> str:
    return f'''
tell application "Reminders"
  set r to first reminder whose id is "{_escape(reminder_id)}"
  set rname to name of r
  try
    set rbody to body of r
  on error
    set rbody to ""
  end try
  set rdone to (completed of r) as text
  try
    set rdue to (due date of r) as text
  on error
    set rdue to ""
  end try
  try
    set rprio to (priority of r) as text
  on error
    set rprio to "0"
  end try
  set rlist to name of container of r
  return (id of r) & "{US}" & rname & "{US}" & rbody & "{US}" & rdone & "{US}" & rdue & "{US}" & rprio & "{US}" & rlist
end tell
'''


def create_reminder_script(
    title: str,
    list_name: str | None,
    body: str | None,
    due: datetime | None,
    priority: str,
) -> str:
    props = [f'name:"{_escape(title)}"']
    if body:
        props.append(f'body:"{_escape(body)}"')
    if priority in PRIORITY_REVERSE:
        props.append(f"priority:{PRIORITY_REVERSE[priority]}")
    props_str = ", ".join(props)

    due_block = ""
    if due is not None:
        due_block = f'''
  set d to current date
  set year of d to {due.year}
  set month of d to {due.month}
  set day of d to {due.day}
  set hours of d to {due.hour}
  set minutes of d to {due.minute}
  set seconds of d to {due.second}
  set due date of newRem to d
'''

    container = (
        f'list "{_escape(list_name)}"' if list_name else "default list"
    )
    return f'''
tell application "Reminders"
  set newRem to make new reminder at {container} with properties {{{props_str}}}
  {due_block}
  return id of newRem
end tell
'''


def complete_reminder_script(reminder_id: str) -> str:
    return f'''
tell application "Reminders"
  set r to first reminder whose id is "{_escape(reminder_id)}"
  set completed of r to true
  return "ok"
end tell
'''


def update_reminder_script(
    reminder_id: str,
    title: str | None,
    body: str | None,
    due: datetime | None,
    priority: str | None,
) -> str:
    setters = []
    if title is not None:
        setters.append(f'set name of r to "{_escape(title)}"')
    if body is not None:
        setters.append(f'set body of r to "{_escape(body)}"')
    if priority in PRIORITY_REVERSE:
        setters.append(f"set priority of r to {PRIORITY_REVERSE[priority]}")
    due_block = ""
    if due is not None:
        due_block = f'''
  set d to current date
  set year of d to {due.year}
  set month of d to {due.month}
  set day of d to {due.day}
  set hours of d to {due.hour}
  set minutes of d to {due.minute}
  set seconds of d to {due.second}
  set due date of r to d
'''
    body_block = "\n  ".join(setters)
    return f'''
tell application "Reminders"
  set r to first reminder whose id is "{_escape(reminder_id)}"
  {body_block}
  {due_block}
  return "ok"
end tell
'''


def delete_reminder_script(reminder_id: str) -> str:
    return f'''
tell application "Reminders"
  delete (first reminder whose id is "{_escape(reminder_id)}")
  return "ok"
end tell
'''


# ---------- Tool implementations ----------

def _format_reminder(rec: dict[str, str]) -> dict[str, Any]:
    return {
        "id": rec.get("id", ""),
        "title": rec.get("title", ""),
        "notes": rec.get("body", ""),
        "completed": rec.get("done", "false") == "true",
        "due": _to_iso(rec.get("due", "")),
        "priority": PRIORITY_MAP.get(int(rec.get("priority") or 0), "none"),
        "list": rec.get("list", ""),
    }


def tool_list_lists() -> list[dict[str, str]]:
    raw = _osascript(LIST_LISTS)
    return _parse_records(raw, ["id", "name"])


def tool_list_reminders(
    list_name: str | None,
    include_completed: bool,
    query: str | None,
    due_before: str | None,
) -> list[dict[str, Any]]:
    raw = _osascript(list_reminders_script(list_name, include_completed))
    fields = ["id", "title", "body", "done", "due", "priority", "list"]
    items = [_format_reminder(r) for r in _parse_records(raw, fields)]
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


def tool_get_reminder(reminder_id: str) -> dict[str, Any]:
    raw = _osascript(get_reminder_script(reminder_id))
    fields = ["id", "title", "body", "done", "due", "priority", "list"]
    recs = _parse_records(raw + RS, fields)
    if not recs:
        raise ValueError(f"reminder {reminder_id} not found")
    return _format_reminder(recs[0])


def tool_create_reminder(
    title: str,
    list_name: str | None,
    notes: str | None,
    due: str | None,
    priority: str,
) -> dict[str, str]:
    due_dt = datetime.fromisoformat(due) if due else None
    new_id = _osascript(
        create_reminder_script(title, list_name, notes, due_dt, priority)
    )
    return {"id": new_id, "status": "created"}


def tool_complete_reminder(reminder_id: str) -> dict[str, str]:
    _osascript(complete_reminder_script(reminder_id))
    return {"id": reminder_id, "status": "completed"}


def tool_update_reminder(
    reminder_id: str,
    title: str | None,
    notes: str | None,
    due: str | None,
    priority: str | None,
) -> dict[str, str]:
    due_dt = datetime.fromisoformat(due) if due else None
    _osascript(
        update_reminder_script(reminder_id, title, notes, due_dt, priority)
    )
    return {"id": reminder_id, "status": "updated"}


def tool_delete_reminder(reminder_id: str) -> dict[str, str]:
    _osascript(delete_reminder_script(reminder_id))
    return {"id": reminder_id, "status": "deleted"}


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
            "keyword in title/notes, and due-before cutoff."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "list_name": {"type": "string"},
                "include_completed": {"type": "boolean", "default": False},
                "query": {"type": "string"},
                "due_before": {
                    "type": "string",
                    "description": "ISO 8601 datetime; only items due before this are returned.",
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
        if name == "list_lists":
            result = tool_list_lists()
        elif name == "list_reminders":
            result = tool_list_reminders(
                arguments.get("list_name"),
                arguments.get("include_completed", False),
                arguments.get("query"),
                arguments.get("due_before"),
            )
        elif name == "get_reminder":
            result = tool_get_reminder(arguments["id"])
        elif name == "create_reminder":
            result = tool_create_reminder(
                arguments["title"],
                arguments.get("list_name"),
                arguments.get("notes"),
                arguments.get("due"),
                arguments.get("priority", "none"),
            )
        elif name == "complete_reminder":
            result = tool_complete_reminder(arguments["id"])
        elif name == "update_reminder":
            result = tool_update_reminder(
                arguments["id"],
                arguments.get("title"),
                arguments.get("notes"),
                arguments.get("due"),
                arguments.get("priority"),
            )
        elif name == "delete_reminder":
            result = tool_delete_reminder(arguments["id"])
        else:
            raise ValueError(f"unknown tool: {name}")
        return [TextContent(type="text", text=json.dumps(result, indent=2))]
    except Exception as e:
        return [TextContent(type="text", text=json.dumps({"error": str(e)}))]


async def _run() -> None:
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


def main() -> None:
    if sys.platform != "darwin":
        print(
            "apple-reminders-mcp must run on macOS (uses osascript).",
            file=sys.stderr,
        )
        sys.exit(1)
    asyncio.run(_run())


if __name__ == "__main__":
    main()
