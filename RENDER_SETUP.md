# Render Free Deployment Notes

## Service naming and domain quality
- Render URL format is: https://<service-name>.onrender.com
- Pick a short readable service name at creation time (example: fiot-abit-api, fiot-abit-web).
- Avoid random suffixes by creating the service with your desired unique name on first try.
- If the name is already taken, Render requires another unique name; use hyphenated readable variants.
- You can attach a custom domain later if needed.

## Required environment variables

### API service (apps/api)
- MONGO_URI: MongoDB Atlas URI
- CRON_SECRET: secret token for cron endpoint
- OFFER_IDS: comma-separated numeric offer IDs
- PORT: optional on Render (Render sets it automatically)

### Web service (apps/web)
- NEXT_PUBLIC_API_URL: public URL of your API service
- NEXT_PUBLIC_OFFER_IDS: optional override for static params on export build

## Render build and start commands

### API Web Service (Free)
- Root Directory: apps/api
- Build Command: npm ci && npm run build
- Start Command: npm run start:local
- Health Check Path: /healthz

### Web Static Site (Free)
- Root Directory: apps/web
- Build Command: npm ci && npm run build
- Publish Directory: out

## Free tier usage and limits impact
- Free web services have a monthly runtime budget (workspace-level pool) and can sleep on inactivity.
- Keeping exactly one always-awake web service is the safest way to stay within free runtime.
- Static Site does not consume web-service instance hours.
- API polling every 10 minutes across ~12 offer pages is low traffic and should not hit Atlas M0 limits quickly.
- Biggest risk is not request volume but keeping multiple free web services awake simultaneously.

## Practical recommendation for this project
- Keep API as the only always-on web service.
- Host frontend as Render Static Site.
- Use external cron ping every 10 minutes to call /api/cron/scrape?token=...
- Monitor Atlas storage growth and API logs for scraper retries.
