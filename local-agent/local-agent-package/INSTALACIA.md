# AutoDesign Local Agent - Inštalačný návod pre klientku

Tento návod vás prevedie inštaláciou a nastavením Local Agenta na vašom počítači.

## Čo budete potrebovať

- ✅ **Mac** s macOS
- ✅ **Adobe Photoshop 2024** (nainštalovaný a funkčný)
- ✅ **Node.js** verzia 18 alebo novšia ([stiahnuť tu](https://nodejs.org/))
- ✅ **Prístup k PSD šablónam** (na Dropboxe alebo lokálne)

## Krok 1: Stiahnutie a rozbalenie

1. Stiahnite si balík `local-agent.zip`
2. Rozbaľte ho do priečinka, napr. `/Users/vase-meno/AutoDesign/local-agent`

## Krok 2: Inštalácia

Otvorte **Terminal** a prejdite do priečinka s agentom:

```bash
cd /Users/vase-meno/AutoDesign/local-agent
```

Spustite inštalačný script:

```bash
chmod +x setup.sh
./setup.sh
```

Script vás prevedie:
- Inštaláciou potrebných balíkov
- Vytvorením konfiguračného súboru `.env`
- Nastavením cesty k vašim PSD šablónam

## Krok 3: Konfigurácia

Otvorte súbor `.env` v textovom editore a nastavte:

```env
# API URL PWA aplikácie
API_BASE_URL=https://mirka-appka.vercel.app

# Tajný token (požiadajte administrátora o token)
AGENT_SECRET_TOKEN=tu-vlozit-tajny-token

# Simulačný režim (nastavte na false pre produkciu)
ENABLE_SIMULATION=false
```

> **Dôležité:** Token `AGENT_SECRET_TOKEN` vám poskytne administrátor systému.

## Krok 4: Nastavenie cesty k šablónam

Otvorte súbor `config.json` a skontrolujte cestu k vašim PSD šablónam:

```json
{
  "dropboxRoot": "/Users/vase-meno/Dropbox/TEMPLATES",
  "apiBaseUrl": "https://mirka-appka.vercel.app/api",
  "pollIntervalMs": 5000
}
```

Uistite sa, že cesta `dropboxRoot` ukazuje na priečinok, kde máte PSD súbory.

## Krok 5: Prvé spustenie (test)

Spustite agenta manuálne na test:

```bash
npm start
```

Malo by sa zobraziť:

```
Starting AutoDesign Local Agent v3.5...
Settings updated from PWA.
Watching Dropbox Templates at: /Users/vase-meno/Dropbox/TEMPLATES
Initial scan complete. Ready for changes.
Polling... No pending jobs.
```

Ak vidíte túto hlášku, agent funguje správne! Stlačte `Ctrl+C` na zastavenie.

## Krok 6: Inštalácia ako služby (automatický štart)

Aby agent bežal automaticky na pozadí:

```bash
chmod +x install-service.sh
./install-service.sh
```

Agent sa teraz spustí automaticky pri každom štarte počítača.

## Ovládanie služby

**Zastaviť agenta:**
```bash
launchctl unload ~/Library/LaunchAgents/com.autodesign.agent.plist
```

**Spustiť agenta:**
```bash
launchctl load ~/Library/LaunchAgents/com.autodesign.agent.plist
```

**Zobraziť logy:**
```bash
tail -f ~/AutoDesign/local-agent/agent-stdout.log
```

## Riešenie problémov

### Agent sa nespúšťa
- Skontrolujte, či máte nainštalovaný Node.js: `node -v`
- Skontrolujte logy: `cat agent-stderr.log`

### Photoshop sa neotvorí
- Uistite sa, že máte nainštalovaný **Adobe Photoshop 2024**
- Skontrolujte, či je cesta v `photoshop.js` správna

### Úlohy sa nespracovávajú
- Skontrolujte, či je `AGENT_SECRET_TOKEN` správne nastavený
- Overte pripojenie k internetu
- Skontrolujte logy: `tail -f agent-stdout.log`

## Kontakt

V prípade problémov kontaktujte administrátora systému.

---

**Verzia:** 1.0  
**Dátum:** 2026-02-08
