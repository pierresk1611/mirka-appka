# AutoDesign & Print Manager v3.2

## 🚀 Cloud PWA (Operator Dashboard)
This repository contains the Next.js Web Application in the root directory.

**Deploy to Vercel:**
- Simply import this repository.
- Vercel will automatically detect the Next.js app in the root.
- **No special configuration needed.**

## 📂 Other Components

- **`/wp-connector`**: WordPress Plugin.
  - Upload this folder (or zip) to your WordPress `wp-content/plugins` directory.
- **`/local-agent`**: Node.js Service.
  - Runs locally on your print server (Mac).
  - See `local-agent/README.md` (if available) or `walkthrough.md`.

## Development

### Cloud PWA
```bash
npm install
npm run dev
```

### Local Agent
```bash
cd local-agent
npm install
node index.js
```
