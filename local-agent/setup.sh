#!/bin/bash

echo "=================================================="
echo "   AutoDesign Local Agent - Inštalácia"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nie je nainštalovaný!"
    echo "Prosím, nainštalujte Node.js z https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js verzia: $(node -v)"
echo ""

# Install dependencies
echo "📦 Inštalujem závislosti..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Inštalácia zlyhala!"
    exit 1
fi

echo ""
echo "✅ Závislosti nainštalované!"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Vytváram konfiguračný súbor .env..."
    cat > .env << 'EOF'
# API URL PWA aplikácie
API_BASE_URL=https://mirka-appka.vercel.app

# Tajný token pre autentifikáciu
AGENT_SECRET_TOKEN=mirka-agent-2026-sk-7x9p2m4n8q1w5e3r6t

# Povoliť simulačný režim (true/false)
ENABLE_SIMULATION=false
EOF
    echo "✅ Súbor .env vytvorený!"
    echo ""
    echo "⚠️  DÔLEŽITÉ: Otvorte súbor .env a nastavte:"
    echo "   - AGENT_SECRET_TOKEN (vygenerujte si vlastný bezpečný token)"
    echo ""
else
    echo "ℹ️  Súbor .env už existuje, preskakujem..."
fi

# Update config.json with user's Dropbox path
echo ""
echo "📂 Nastavenie cesty k Dropbox šablónam..."
echo "Aktuálna cesta v config.json:"
CURRENT_PATH=$(node -p "require('./config.json').dropboxRoot")
echo "  $CURRENT_PATH"
echo ""
read -p "Zadajte cestu k vašim PSD šablónam (alebo Enter pre ponechanie aktuálnej): " DROPBOX_PATH

if [ ! -z "$DROPBOX_PATH" ]; then
    # Update config.json
    node -e "
    const fs = require('fs');
    const config = require('./config.json');
    config.dropboxRoot = '$DROPBOX_PATH';
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
    "
    echo "✅ Cesta aktualizovaná na: $DROPBOX_PATH"
fi

echo ""
echo "=================================================="
echo "   ✅ Inštalácia dokončená!"
echo "=================================================="
echo ""
echo "Ďalšie kroky:"
echo "1. Upravte .env súbor a nastavte AGENT_SECRET_TOKEN"
echo "2. Spustite agenta: npm start"
echo "3. Pre automatické spustenie pri štarte systému:"
echo "   ./install-service.sh"
echo ""
