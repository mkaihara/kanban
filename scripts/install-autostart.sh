#!/bin/bash
# Build the app and start it at every login (port 3210), opening the board in the browser.
# Usage: scripts/install-autostart.sh [data-file]   (default: iCloud Drive/Kanban/kanban.json)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/frontend"
PORT=3210
URL="http://localhost:$PORT"
DATA_FILE="${1:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/Kanban/kanban.json}"
[[ "$DATA_FILE" = /* ]] || DATA_FILE="$PWD/$DATA_FILE"
NODE="$(command -v node)"
LOGS="$HOME/Library/Logs/kanban"
AGENTS="$HOME/Library/LaunchAgents"
SERVER=local.kanban.server
OPENER=local.kanban.open

(cd "$APP" && npm install && npm run build)

mkdir -p "$LOGS" "$AGENTS"
for label in $SERVER $OPENER; do
  launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
done

cat > "$AGENTS/$SERVER.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$SERVER</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$APP/node_modules/next/dist/bin/next</string>
    <string>start</string>
    <string>-H</string><string>127.0.0.1</string>
    <string>-p</string><string>$PORT</string>
  </array>
  <key>WorkingDirectory</key><string>$APP</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>KANBAN_DATA_FILE</key><string>$DATA_FILE</string>
    <key>NODE_ENV</key><string>production</string>
    <key>PATH</key><string>$(dirname "$NODE"):/usr/bin:/bin</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOGS/server.log</string>
  <key>StandardErrorPath</key><string>$LOGS/server.log</string>
</dict>
</plist>
PLIST

cat > "$AGENTS/$OPENER.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$OPENER</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>until /usr/bin/curl -sf -o /dev/null $URL; do sleep 1; done; /usr/bin/open $URL</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>StandardErrorPath</key><string>$LOGS/open.log</string>
</dict>
</plist>
PLIST

for label in $SERVER $OPENER; do
  launchctl bootstrap "gui/$(id -u)" "$AGENTS/$label.plist"
done

echo "Kanban runs at $URL and starts at login."
echo "Data file: $DATA_FILE"
echo "Logs: $LOGS"
