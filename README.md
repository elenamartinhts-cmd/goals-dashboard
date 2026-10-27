# Goals Dashboard

Your personal closer tracker — $10K months, built mobile-first.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `APP_PASSWORD` | Your chosen login password |
| `JWT_SECRET` | Random 32-char string from https://generate-secret.vercel.app/32 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud → Service Account email |
| `GOOGLE_PRIVATE_KEY` | Google Cloud → Service Account JSON key |

### 3. Database
Run `supabase/migrations/001_initial.sql` in Supabase → SQL Editor.

### 4. Google Sheets access
Share your spreadsheet with the service account email (viewer access).

### 5. App icons
Generate PNG icons from `public/icons/icon.svg`:
- 192×192 → `public/icons/icon-192.png`
- 512×512 → `public/icons/icon-512.png`

Use https://svgtopng.com or any image converter.

## Run locally
```bash
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Add all environment variables from `.env.local` in Vercel → Settings → Environment Variables
4. Deploy

## Update offers
Settings → Offers section → add/remove offers. Save settings.

## Redeploy after code changes
```bash
git add -A
git commit -m "describe change"
git push
```
Vercel auto-deploys on push.

## How warm-up data works
Calls logged before November 1, 2026 are treated as warm-up data.
They appear in your call list with a "warm-up" indicator and are excluded
from November/December target tracking.
