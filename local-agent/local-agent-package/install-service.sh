#!/bin/bash

echo "=================================================="
echo "   Inštalácia AutoDesign Agent ako služby"
echo "=================================================="
echo ""

# Get the current directory
AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.autodesign.agent"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "📂 Agent adresár: $AGENT_DIR"
echo ""

# Create LaunchAgents directory if it doesn't exist
mkdir -p "$HOME/Library/LaunchAgents"

# Create the plist file
echo "📝 Vytváram službu..."
cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$AGENT_DIR/index.js</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$AGENT_DIR</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$AGENT_DIR/agent-stdout.log</string>
    
    <key>StandardErrorPath</key>
    <string>$AGENT_DIR/agent-stderr.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

echo "✅ Služba vytvorená: $PLIST_PATH"
echo ""

# Load the service
echo "🚀 Spúšťam službu..."
launchctl unload "$PLIST_PATH" 2>/dev/null
launchctl load "$PLIST_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Služba úspešne spustená!"
    echo ""
    echo "Agent teraz beží na pozadí a spustí sa automaticky pri každom štarte systému."
    echo ""
    echo "Užitočné príkazy:"
    echo "  Zastaviť:  launchctl unload $PLIST_PATH"
    echo "  Spustiť:   launchctl load $PLIST_PATH"
    echo "  Logy:      tail -f $AGENT_DIR/agent-stdout.log"
else
    echo "❌ Chyba pri spúšťaní služby!"
    exit 1
fi

echo ""
echo "=================================================="
echo "   ✅ Inštalácia služby dokončená!"
echo "=================================================="
