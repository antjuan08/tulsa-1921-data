-- Usage: osascript update_reminder.applescript <id> <title|-> <notes|-> <due_iso|-> <priority|->
-- Pass "-" to leave a field unchanged. priority is an integer (0/1/5/9).

on parseISO(s)
	set d to current date
	set year of d to (text 1 thru 4 of s) as integer
	set month of d to (text 6 thru 7 of s) as integer
	set day of d to (text 9 thru 10 of s) as integer
	set hours of d to (text 12 thru 13 of s) as integer
	set minutes of d to (text 15 thru 16 of s) as integer
	set seconds of d to (text 18 thru 19 of s) as integer
	return d
end parseISO

on run argv
	if (count of argv) < 1 then error "reminder id required"
	set rid to item 1 of argv
	set newTitle to "-"
	set newNotes to "-"
	set newDue to "-"
	set newPrio to "-"
	if (count of argv) >= 2 then set newTitle to item 2 of argv
	if (count of argv) >= 3 then set newNotes to item 3 of argv
	if (count of argv) >= 4 then set newDue to item 4 of argv
	if (count of argv) >= 5 then set newPrio to item 5 of argv

	tell application "Reminders"
		set r to first reminder whose id is rid
		if newTitle is not "-" then set name of r to newTitle
		if newNotes is not "-" then set body of r to newNotes
		if newDue is not "-" then set due date of r to my parseISO(newDue)
		if newPrio is not "-" then set priority of r to (newPrio as integer)
		return "ok"
	end tell
end run
