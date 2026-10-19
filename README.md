# VRANT

Online store for VRANT, a Ghanaian fashion house in Takoradi. It sells clothing, jeans and footwear, and takes custom design orders.

| Part | Stack | Hosting |
|---|---|---|
| Website (`/`) | React 18, Vite, TypeScript, Tailwind | Vercel |
| API (`/backend`) | Node 22, Express, Mongoose | Render |
| Services | MongoDB Atlas, Cloudinary (images), Paystack (payments), Brevo (email), mNotify (SMS) | — |

## Run locally

```bash
# 1. API
cd backend
cp .env.example .env          # fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD at least
npm install
node scripts/ensureAdmin.js   # creates the admin login from ADMIN_EMAIL / ADMIN_PASSWORD
node scripts/seed-vrant-catalog.js   # optional: starter products + lookbook
npm run dev                   # http://localhost:5000

# 2. Website (new terminal, project root)
cp .env.example .env
npm install
npm run dev                   # http://localhost:8080 (proxies /api to :5000)
```

## Deploy

### 1. Backend: Render
1. Push this repo to GitHub, then in Render choose **New → Blueprint** and select the repo. Render reads `render.yaml`, and the service root is `backend/`.
2. Fill in the secret environment variables Render asks for (MongoDB, Cloudinary, Paystack and so on).
3. In MongoDB Atlas, open **Network Access** and allow Render to connect. Atlas → Network Access → `0.0.0.0/0` works, or use Render's static outbound IPs.
4. After the first deploy, open the Render shell and run `node scripts/ensureAdmin.js`.
5. In the Paystack dashboard, set the webhook URL to `https://<render-service>/api/payments/webhook`.

### 2. Website: Vercel
1. **Add New → Project**, then import the repo. Leave the root directory as `/`; Vercel detects Vite from `vercel.json`.
2. Add these environment variables:
   - `VITE_API_URL`: your Render URL, e.g. `https://vrant-api.onrender.com`
   - `VITE_SITE_URL`: your Vercel URL or custom domain
   - `VITE_WHATSAPP_NUMBER`: `233200906851`
3. Deploy.

### 3. Connect them
Back in Render, set `FRONTEND_URL` to the Vercel URL. Add a custom domain or `www` version to `CORS_ORIGINS`, comma-separated. Then redeploy the API.

> Vite bakes `VITE_*` variables in at build time. After changing one on Vercel, **redeploy**.

## Useful scripts (run in `backend/`)

| Command | What it does |
|---|---|
| `node scripts/ensureAdmin.js` | Create or reset the admin from `.env` |
| `node scripts/seed-vrant-catalog.js` | Load or refresh the starter catalog and gallery (safe to re-run) |
| `npm run migrate:images` | Move old local `/uploads` images to Cloudinary |

## Security notes
- Never commit `.env` files. `.gitignore` already excludes them; use the `.env.example` templates.
- In production, image uploads require Cloudinary. Local uploads are for development only.
