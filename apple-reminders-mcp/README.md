# apple-reminders-mcp

A small MCP server that exposes macOS **Reminders.app** to any MCP-compatible client (Claude Code, Claude Desktop, etc.) via AppleScript (`osascript`).

> Runs on macOS only. Linux/Windows clients can still call it remotely if you proxy stdio.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_lists` | Enumerate every Reminders list. |
| `list_reminders` | Read reminders, with filters: `list_name`, `include_completed`, `query`, `due_before`. |
| `get_reminder` | Fetch one reminder by ID. |
| `create_reminder` | Create a reminder with title, list, notes, due date, priority. |
| `complete_reminder` | Mark as done. |
| `update_reminder` | Patch title / notes / due / priority. |
| `delete_reminder` | Permanent delete. |

Returned reminder shape:

```json
{
  "id": "x-coredata://...",
  "title": "Buy milk",
  "notes": "2%",
  "completed": false,
  "due": "2026-05-12T18:00:00",
  "priority": "medium",
  "list": "Personal"
}
```

## Install (on your Mac)

```bash
git clone <this repo> && cd apple-reminders-mcp
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
```

The first run will trigger macOS's **Reminders access** prompt. Grant it — you can revoke later in *System Settings → Privacy & Security → Reminders*.

## Wire into Claude Code

Add to `~/.claude/settings.json` (or your project's `.claude/settings.json`):

```json
{
  "mcpServers": {
    "apple-reminders": {
      "command": "/absolute/path/to/.venv/bin/python",
      "args": ["/absolute/path/to/apple-reminders-mcp/server.py"]
    }
  }
}
```

Restart Claude Code. The seven tools above will be available.

## Wire into Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` with the same `mcpServers` block.

## Caveats

- AppleScript date parsing uses your system locale; the server normalizes to ISO 8601 best-effort. If you see unparsed strings, file an issue with your locale.
- Location-based triggers and recurrence are **not** exposed — AppleScript's surface is limited. For those, a Swift/EventKit bridge would be needed.
- This server was authored on Linux and not executed end-to-end on macOS. Treat the first run as a smoke test; the AppleScript snippets are conservative but date-mutation in particular benefits from real-machine verification.

## Use cases

See the conversation that spawned this repo, or the short list:

- Morning briefing of items due today
- Weekly review (open vs. completed, oldest open)
- Cross-syncing flagged reminders into GitHub issues, Notion, or Linear
- Conflict-checking reminders against calendar events
- Bulk reschedule of overdue items
- Natural-language create: "remind me to call Sam tomorrow at 3pm on the Work list"
