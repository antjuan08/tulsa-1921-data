-- Usage: osascript complete_reminder.applescript <reminder_id>

on run argv
	if (count of argv) < 1 then error "reminder id required"
	set rid to item 1 of argv
	tell application "Reminders"
		set r to first reminder whose id is rid
		set completed of r to true
		return "ok"
	end tell
end run
