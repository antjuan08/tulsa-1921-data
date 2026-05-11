-- Usage: osascript list_reminders.applescript [list_name] [include_completed:true|false]
-- Pass "" for list_name to read all lists.
-- Output: one reminder per RS-terminated record.
-- Fields (US-separated): id, name, body, completed, due, priority, list

on run argv
	set US to character id 31
	set RS to character id 30
	set listName to ""
	set includeCompleted to false
	if (count of argv) >= 1 then set listName to item 1 of argv
	if (count of argv) >= 2 then
		if (item 2 of argv) is "true" then set includeCompleted to true
	end if

	tell application "Reminders"
		if listName is not "" then
			set src to reminders of list listName
		else
			set src to reminders
		end if

		set output to ""
		repeat with r in src
			set isDone to completed of r
			if includeCompleted or (not isDone) then
				set rid to id of r
				set rname to name of r
				try
					set rbody to body of r
					if rbody is missing value then set rbody to ""
				on error
					set rbody to ""
				end try
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
				set output to output & rid & US & rname & US & rbody & US & (isDone as text) & US & rdue & US & rprio & US & rlist & RS
			end if
		end repeat
		return output
	end tell
end run
