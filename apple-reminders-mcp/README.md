# apple-reminders-mcp

MCP server exposing macOS **Reminders.app** to any MCP client (Claude Code, Claude Desktop, …).

Two interchangeable backends:

| Backend | Where | When to pick |
| --- | --- | --- |
| **AppleScript** (default) | `applescripts/*.applescript` driven by `osascript` | Zero build step. Works on any macOS. |
| **EventKit** | `eventkit/Reminders.swift` compiled to `eventkit/reminders` | Native fidelity: recurrence rules, alarms, faster bulk reads. |

The Python server (`server.py`) auto-detects which backend to use — if the compiled `eventkit/reminders` exists it is preferred; otherwise it falls back to AppleScript. Override with `APPLE_REMINDERS_BACKEND=applescript` or `=eventkit`.

## Tools

| Tool | Notes |
| --- | --- |
| `list_lists` | All Reminders lists with `id` + `name`. |
| `list_reminders` | Filters: `list_name`, `include_completed`, `query`, `due_before` (ISO). |
| `get_reminder` | By `id`. |
| `create_reminder` | `title` (req), `list_name`, `notes`, `due` (ISO), `priority` (none/low/medium/high). |
| `complete_reminder` | Mark done. |
| `update_reminder` | Patch any subset. |
| `delete_reminder` | Irreversible. |

Reminder shape returned:

```json
{
  "id": "x-coredata://…",
  "title": "Buy milk",
  "notes": "2%",
  "completed": false,
  "due": "2026-05-12T18:00:00",
  "priority": "medium",
  "list": "Personal"
}
```

EventKit backend additionally returns `has_recurrence`, `alarm_count`, and `completed_at` when applicable.

## Install — AppleScript backend (no compile)

```bash
git clone <repo> && cd apple-reminders-mcp
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
```

First run triggers macOS's **Reminders access** prompt. Approve it once.

Smoke test a script directly:

```bash
osascript applescripts/list_lists.applescript
```

## Install — EventKit backend (richer)

```bash
cd eventkit && ./build.sh        # requires Xcode CLI tools (`xcode-select --install`)
```

This produces `eventkit/reminders`. First invocation prompts for Reminders full access. The `Info.plist` next to the binary supplies `NSRemindersUsageDescription`, which macOS requires.

Try it:

```bash
./eventkit/reminders list-lists
./eventkit/reminders list-reminders --list "Personal"
./eventkit/reminders create-reminder --title "Test" --due 2026-05-12T18:00:00
```

## Wire into Claude Code

`~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "apple-reminders": {
      "command": "/absolute/path/to/.venv/bin/python",
      "args": ["/absolute/path/to/apple-reminders-mcp/server.py"],
      "env": { "APPLE_REMINDERS_BACKEND": "auto" }
    }
  }
}
```

## Architecture

```
client (Claude) ──stdio──▶ server.py ──┬─▶ osascript ──▶ applescripts/*.applescript ──▶ Reminders.app
                                       └─▶ eventkit/reminders ──▶ EventKit framework ──▶ Reminders DB
```

Each AppleScript is a thin, callable wrapper that accepts positional args (`on run argv`) and emits records separated by U+001E with U+001F unit separators — `server.py` parses these. The EventKit CLI emits JSON directly.

## Caveats

- AppleScript date strings are locale-formatted. `server.py` tries multiple parse formats; if you see raw strings come through, file an issue with your locale + sample.
- AppleScript backend cannot read recurrence rules or alarms. Use EventKit for those.
- Bulk reads via AppleScript are linear over reminders — EventKit is faster for thousands of items.
- This code was authored on Linux and has not been executed end-to-end on macOS. Treat first runs as smoke tests.
