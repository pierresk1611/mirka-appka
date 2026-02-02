# AutoDesign & Print Manager v3.2

This is a monorepo containing the three core components of the AutoDesign system.

## Project Structure

- **`/cloud-pwa`**: Next.js Web Application (Operator Dashboard).
  - *Deploy to Vercel.*
- **`/wp-connector`**: WordPress Plugin.
  - *Upload to WordPress (`wp-content/plugins`).*
- **`/local-agent`**: Node.js Service.
  - *Run locally on the print server (Mac).*

## 🚀 How to Deploy on Vercel

Since this is a monorepo, you must configure Vercel to look in the correct folder:

1. Import this repository to Vercel.
2. In **Project Settings** > **General**:
   - Change **Root Directory** to: `cloud-pwa`
3. In **Environment Variables**:
   - Add default `OPENAI_API_KEY` (see `cloud-pwa/.env.example`).
4. Click **Deploy**.

## Local Development

### Cloud PWA
```bash
cd cloud-pwa
npm install
npm run dev
```

### Local Agent
```bash
cd local-agent
npm install
node index.js
```
