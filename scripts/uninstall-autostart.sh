#!/bin/bash
# Stop the Kanban server and remove it from login. The data file is left untouched.
set -euo pipefail

for label in local.kanban.server local.kanban.open; do
  launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
  rm -f "$HOME/Library/LaunchAgents/$label.plist"
done
echo "Kanban autostart removed."
