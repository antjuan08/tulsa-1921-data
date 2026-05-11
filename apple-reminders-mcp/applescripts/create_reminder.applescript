-- Usage: osascript create_reminder.applescript <title> [list_name] [notes] [due_iso] [priority]
--   priority: 0 (none) | 1 (high) | 5 (medium) | 9 (low)
--   due_iso : YYYY-MM-DDTHH:MM:SS  (pass "" for no due date)
-- Output: id of created reminder

on parseISO(s)
	-- s like 2026-05-12T14:30:00
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
	if (count of argv) < 1 then error "title required"
	set theTitle to item 1 of argv
	set theList to ""
	set theNotes to ""
	set theDue to ""
	set thePriority to 0
	if (count of argv) >= 2 then set theList to item 2 of argv
	if (count of argv) >= 3 then set theNotes to item 3 of argv
	if (count of argv) >= 4 then set theDue to item 4 of argv
	if (count of argv) >= 5 then set thePriority to (item 5 of argv) as integer

	tell application "Reminders"
		if theList is not "" then
			set container to list theList
		else
			set container to default list
		end if
		set props to {name:theTitle, priority:thePriority}
		if theNotes is not "" then set props to props & {body:theNotes}
		set newRem to make new reminder at container with properties props
		if theDue is not "" then set due date of newRem to my parseISO(theDue)
		return id of newRem
	end tell
end run
