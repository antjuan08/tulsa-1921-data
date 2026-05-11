-- Usage: osascript get_reminder.applescript <reminder_id>
-- Output: single record, US-separated. Fields: id, name, body, completed, due, priority, list

on run argv
	set US to character id 31
	if (count of argv) < 1 then error "reminder id required"
	set rid to item 1 of argv
	tell application "Reminders"
		set r to first reminder whose id is rid
		set rname to name of r
		try
			set rbody to body of r
			if rbody is missing value then set rbody to ""
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
		return rid & US & rname & US & rbody & US & rdone & US & rdue & US & rprio & US & rlist
	end tell
end run
