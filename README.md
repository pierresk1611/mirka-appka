# AutoDesign & Print Manager v3.2

This repository uses a **Monorepo Structure**.

## 📂 Project Structure

- **`/cloud-pwa`**: Next.js Web Application (Operator Dashboard).
  - **Vercel Deployment**: Root Directory must be set to `cloud-pwa`.
- **`/wp-connector`**: WordPress Plugin.
- **`/local-agent`**: Node.js Service (Local Print Server).

## 🚀 Deployment Fix

If you are deploying to Vercel:
- This project is located in the `cloud-pwa` folder.
- Vercel should automatically detect this, or you can set **Root Directory** to `cloud-pwa`.

## Development

### Cloud PWA
```bash
cd cloud-pwa
npm install
npm run dev
```
