-- Usage: osascript delete_reminder.applescript <reminder_id>

on run argv
	if (count of argv) < 1 then error "reminder id required"
	set rid to item 1 of argv
	tell application "Reminders"
		delete (first reminder whose id is rid)
		return "ok"
	end tell
end run
