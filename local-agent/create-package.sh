#!/bin/bash

echo "=================================================="
echo "   Vytváram inštalačný balík pre klientku"
echo "=================================================="
echo ""

# Create package directory
PACKAGE_DIR="local-agent-package"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

echo "📦 Kopírujem súbory..."

# Copy necessary files
cp -r scripts "$PACKAGE_DIR/"
cp index.js "$PACKAGE_DIR/"
cp photoshop.js "$PACKAGE_DIR/"
cp watcher.js "$PACKAGE_DIR/"
cp imposition.js "$PACKAGE_DIR/"
cp config.json "$PACKAGE_DIR/"
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/" 2>/dev/null || true
cp setup.sh "$PACKAGE_DIR/"
cp install-service.sh "$PACKAGE_DIR/"
cp INSTALACIA.md "$PACKAGE_DIR/"

# Create README
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# AutoDesign Local Agent

Tento balík obsahuje všetko potrebné pre spustenie Local Agenta na vašom počítači.

## Rýchly štart

1. Otvorte Terminal
2. Prejdite do tohto priečinka: `cd /cesta/k/local-agent-package`
3. Spustite: `./setup.sh`
4. Postupujte podľa inštrukcií v súbore `INSTALACIA.md`

## Obsah balíka

- `setup.sh` - Inštalačný script
- `install-service.sh` - Inštalácia ako služby (automatický štart)
- `INSTALACIA.md` - Podrobný návod
- `config.json` - Konfigurácia agenta
- `scripts/` - Photoshop skripty
- Ostatné súbory - Zdrojový kód agenta

## Podpora

V prípade problémov kontaktujte administrátora.
EOF

# Make scripts executable
chmod +x "$PACKAGE_DIR/setup.sh"
chmod +x "$PACKAGE_DIR/install-service.sh"

echo "✅ Súbory skopírované"
echo ""

# Create ZIP archive
echo "🗜️  Vytváram ZIP archív..."
zip -r "local-agent-package.zip" "$PACKAGE_DIR" > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Archív vytvorený: local-agent-package.zip"
    echo ""
    echo "📊 Veľkosť: $(du -h local-agent-package.zip | cut -f1)"
    echo ""
    echo "=================================================="
    echo "   ✅ Balík pripravený!"
    echo "=================================================="
    echo ""
    echo "Teraz môžete:"
    echo "1. Poslať súbor 'local-agent-package.zip' klientke"
    echo "2. Klientka ho rozbalí a spustí './setup.sh'"
    echo ""
else
    echo "❌ Chyba pri vytváraní archívu!"
    exit 1
fi
