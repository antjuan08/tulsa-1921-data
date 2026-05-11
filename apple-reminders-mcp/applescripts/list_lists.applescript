-- Usage: osascript list_lists.applescript
-- Output: one list per line, fields separated by U+001F (US), terminated by U+001E (RS)
-- Fields: id, name

on run argv
	set US to character id 31
	set RS to character id 30
	tell application "Reminders"
		set output to ""
		repeat with L in lists
			set output to output & (id of L) & US & (name of L) & RS
		end repeat
		return output
	end tell
end run
