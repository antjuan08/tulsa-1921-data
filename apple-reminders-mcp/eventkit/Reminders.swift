// Reminders.swift — EventKit-backed CLI for macOS Reminders.app.
//
// Build:  swiftc -O Reminders.swift -o reminders
// Usage:  ./reminders <subcommand> [args...]
//
// Subcommands (all emit JSON on stdout):
//   list-lists
//   list-reminders            [--list NAME] [--include-completed] [--query Q] [--due-before ISO]
//   get-reminder              <id>
//   create-reminder           --title T [--list L] [--notes N] [--due ISO] [--priority none|low|medium|high]
//                             [--alarm ISO]... [--recur daily|weekly|monthly|yearly]
//   complete-reminder         <id>
//   update-reminder           <id> [--title T] [--notes N] [--due ISO] [--priority ...]
//   delete-reminder           <id>
//
// Requires Reminders access (granted on first invocation via system prompt).

import EventKit
import Foundation

let store = EKEventStore()

// MARK: - Access

func requestAccess() -> Bool {
    let sem = DispatchSemaphore(value: 0)
    var granted = false
    if #available(macOS 14.0, *) {
        store.requestFullAccessToReminders { ok, _ in granted = ok; sem.signal() }
    } else {
        store.requestAccess(to: .reminder) { ok, _ in granted = ok; sem.signal() }
    }
    sem.wait()
    return granted
}

// MARK: - JSON helpers

let isoFormatter: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime]
    return f
}()

func priorityName(_ p: Int) -> String {
    switch p {
    case 1: return "high"
    case 5: return "medium"
    case 9: return "low"
    default: return "none"
    }
}

func priorityValue(_ name: String) -> Int {
    switch name.lowercased() {
    case "high": return 1
    case "medium": return 5
    case "low": return 9
    default: return 0
    }
}

func encode(_ value: Any) -> String {
    let data = try! JSONSerialization.data(
        withJSONObject: value,
        options: [.prettyPrinted, .sortedKeys, .fragmentsAllowed]
    )
    return String(data: data, encoding: .utf8)!
}

func dueDate(of r: EKReminder) -> Date? {
    guard let comps = r.dueDateComponents else { return nil }
    return Calendar.current.date(from: comps)
}

func reminderDict(_ r: EKReminder) -> [String: Any] {
    var d: [String: Any] = [
        "id": r.calendarItemIdentifier,
        "title": r.title ?? "",
        "notes": r.notes ?? "",
        "completed": r.isCompleted,
        "priority": priorityName(r.priority),
        "list": r.calendar?.title ?? "",
        "has_recurrence": !(r.recurrenceRules ?? []).isEmpty,
        "alarm_count": r.alarms?.count ?? 0,
    ]
    if let due = dueDate(of: r) {
        d["due"] = isoFormatter.string(from: due)
    } else {
        d["due"] = NSNull()
    }
    if let completed = r.completionDate {
        d["completed_at"] = isoFormatter.string(from: completed)
    }
    return d
}

// MARK: - Fetch

func fetchReminders(
    listName: String?,
    includeCompleted: Bool
) -> [EKReminder] {
    var calendars: [EKCalendar]? = nil
    if let name = listName {
        let all = store.calendars(for: .reminder)
        calendars = all.filter { $0.title == name }
        if calendars?.isEmpty ?? true {
            FileHandle.standardError.write("no list named \(name)\n".data(using: .utf8)!)
            exit(1)
        }
    }
    let predicate = includeCompleted
        ? store.predicateForReminders(in: calendars)
        : store.predicateForIncompleteReminders(
            withDueDateStarting: nil, ending: nil, calendars: calendars
        )
    let sem = DispatchSemaphore(value: 0)
    var out: [EKReminder] = []
    store.fetchReminders(matching: predicate) { result in
        out = result ?? []
        sem.signal()
    }
    sem.wait()
    return out
}

func findReminder(id: String) -> EKReminder? {
    let all = fetchReminders(listName: nil, includeCompleted: true)
    return all.first { $0.calendarItemIdentifier == id }
}

// MARK: - Arg parsing

struct Args {
    var positional: [String] = []
    var flags: [String: String] = [:]
    var bools: Set<String> = []
    var repeated: [String: [String]] = [:]
}

func parse(_ raw: [String], booleans: Set<String> = [], repeated: Set<String> = []) -> Args {
    var a = Args()
    var i = 0
    while i < raw.count {
        let tok = raw[i]
        if tok.hasPrefix("--") {
            let key = String(tok.dropFirst(2))
            if booleans.contains(key) {
                a.bools.insert(key)
                i += 1
            } else {
                let val = (i + 1 < raw.count) ? raw[i + 1] : ""
                if repeated.contains(key) {
                    a.repeated[key, default: []].append(val)
                } else {
                    a.flags[key] = val
                }
                i += 2
            }
        } else {
            a.positional.append(tok)
            i += 1
        }
    }
    return a
}

func parseDate(_ s: String) -> Date? {
    if let d = isoFormatter.date(from: s) { return d }
    let alt = ISO8601DateFormatter()
    alt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return alt.date(from: s)
}

// MARK: - Subcommands

func cmdListLists() {
    let cals = store.calendars(for: .reminder)
    let payload = cals.map { ["id": $0.calendarIdentifier, "name": $0.title] }
    print(encode(payload))
}

func cmdListReminders(_ argv: [String]) {
    let a = parse(argv, booleans: ["include-completed"])
    let items = fetchReminders(
        listName: a.flags["list"],
        includeCompleted: a.bools.contains("include-completed")
    )
    var dicts = items.map(reminderDict)
    if let q = a.flags["query"]?.lowercased() {
        dicts = dicts.filter {
            (($0["title"] as? String) ?? "").lowercased().contains(q)
                || (($0["notes"] as? String) ?? "").lowercased().contains(q)
        }
    }
    if let cutoffStr = a.flags["due-before"], let cutoff = parseDate(cutoffStr) {
        dicts = dicts.filter {
            guard let dueStr = $0["due"] as? String,
                  let due = parseDate(dueStr) else { return false }
            return due < cutoff
        }
    }
    print(encode(dicts))
}

func cmdGetReminder(_ argv: [String]) {
    guard let id = argv.first, let r = findReminder(id: id) else {
        FileHandle.standardError.write("not found\n".data(using: .utf8)!)
        exit(1)
    }
    print(encode(reminderDict(r)))
}

func recurrenceFrom(_ name: String) -> EKRecurrenceRule? {
    let freq: EKRecurrenceFrequency
    switch name.lowercased() {
    case "daily": freq = .daily
    case "weekly": freq = .weekly
    case "monthly": freq = .monthly
    case "yearly": freq = .yearly
    default: return nil
    }
    return EKRecurrenceRule(recurrenceWith: freq, interval: 1, end: nil)
}

func cmdCreateReminder(_ argv: [String]) {
    let a = parse(argv, repeated: ["alarm"])
    guard let title = a.flags["title"] else {
        FileHandle.standardError.write("--title required\n".data(using: .utf8)!)
        exit(1)
    }
    let r = EKReminder(eventStore: store)
    r.title = title
    r.notes = a.flags["notes"]
    r.priority = priorityValue(a.flags["priority"] ?? "none")

    let calendars = store.calendars(for: .reminder)
    if let listName = a.flags["list"],
       let cal = calendars.first(where: { $0.title == listName }) {
        r.calendar = cal
    } else {
        r.calendar = store.defaultCalendarForNewReminders()
    }

    if let dueStr = a.flags["due"], let due = parseDate(dueStr) {
        r.dueDateComponents = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute, .second], from: due
        )
    }

    if let alarms = a.repeated["alarm"] {
        r.alarms = alarms.compactMap(parseDate).map { EKAlarm(absoluteDate: $0) }
    }

    if let recur = a.flags["recur"], let rule = recurrenceFrom(recur) {
        r.addRecurrenceRule(rule)
    }

    do {
        try store.save(r, commit: true)
        print(encode(["id": r.calendarItemIdentifier, "status": "created"]))
    } catch {
        FileHandle.standardError.write("save failed: \(error)\n".data(using: .utf8)!)
        exit(1)
    }
}

func cmdCompleteReminder(_ argv: [String]) {
    guard let id = argv.first, let r = findReminder(id: id) else {
        FileHandle.standardError.write("not found\n".data(using: .utf8)!)
        exit(1)
    }
    r.isCompleted = true
    try? store.save(r, commit: true)
    print(encode(["id": id, "status": "completed"]))
}

func cmdUpdateReminder(_ argv: [String]) {
    guard let id = argv.first, let r = findReminder(id: id) else {
        FileHandle.standardError.write("not found\n".data(using: .utf8)!)
        exit(1)
    }
    let a = parse(Array(argv.dropFirst()))
    if let t = a.flags["title"] { r.title = t }
    if let n = a.flags["notes"] { r.notes = n }
    if let p = a.flags["priority"] { r.priority = priorityValue(p) }
    if let dueStr = a.flags["due"], let due = parseDate(dueStr) {
        r.dueDateComponents = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute, .second], from: due
        )
    }
    try? store.save(r, commit: true)
    print(encode(["id": id, "status": "updated"]))
}

func cmdDeleteReminder(_ argv: [String]) {
    guard let id = argv.first, let r = findReminder(id: id) else {
        FileHandle.standardError.write("not found\n".data(using: .utf8)!)
        exit(1)
    }
    try? store.remove(r, commit: true)
    print(encode(["id": id, "status": "deleted"]))
}

// MARK: - Entry

let args = CommandLine.arguments
guard args.count >= 2 else {
    FileHandle.standardError.write("usage: reminders <subcommand> [args]\n".data(using: .utf8)!)
    exit(2)
}

guard requestAccess() else {
    FileHandle.standardError.write("reminders access denied\n".data(using: .utf8)!)
    exit(1)
}

let sub = args[1]
let rest = Array(args.dropFirst(2))

switch sub {
case "list-lists":         cmdListLists()
case "list-reminders":     cmdListReminders(rest)
case "get-reminder":       cmdGetReminder(rest)
case "create-reminder":    cmdCreateReminder(rest)
case "complete-reminder":  cmdCompleteReminder(rest)
case "update-reminder":    cmdUpdateReminder(rest)
case "delete-reminder":    cmdDeleteReminder(rest)
default:
    FileHandle.standardError.write("unknown subcommand: \(sub)\n".data(using: .utf8)!)
    exit(2)
}
