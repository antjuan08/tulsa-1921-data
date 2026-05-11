#!/usr/bin/env bash
# Build the EventKit CLI. Run on macOS with Xcode command-line tools installed.
set -euo pipefail
cd "$(dirname "$0")"

swiftc -O Reminders.swift \
  -sectcreate __TEXT __info_plist Info.plist \
  -o reminders

echo "built ./reminders"
echo "first run will prompt for Reminders access."
