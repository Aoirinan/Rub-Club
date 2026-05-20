# Production launch — what we need from you

Use this when deploying to Vercel (or similar). Copy `env.example` to Vercel **Production** environment variables. Nothing here requires DNS to be on the new domains yet—you can use the Vercel `*.vercel.app` URL for testing.

## Required for the site to work

| Variable | What to provide |
|----------|-----------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full JSON from Firebase → Project settings → Service accounts → Generate new private key |
| `NEXT_PUBLIC_FIREBASE_*` | Web app config from Firebase console (API key, auth domain, project ID, storage bucket) |
| `NEXT_PUBLIC_APP_URL` | Your live URL with `https://` and no trailing slash (e.g. `https://wellnessparistx.com` or the Vercel URL until DNS is ready) |
| `SENDGRID_API_KEY` | From SendGrid → API Keys |
| `SENDGRID_FROM_EMAIL` | A **verified** sender in SendGrid (clinic email, not a personal test address in production) |
| `OFFICE_NOTIFICATION_EMAIL` | Optional email copies for bookings + contact form. Use **`dr.seanwelborn@gmail.com`**. Front desk should use **Admin → Contact inbox**, not email. |

## Contact form (required for handoff)

Every public `/contact` submission is:

1. **Saved in Firestore** (`contact_submissions`) — **front desk checks Admin → Contact inbox** after staff sign-in (all roles, including front desk).
2. **Optional email copy** to `OFFICE_NOTIFICATION_EMAIL` (`dr.seanwelborn@gmail.com`) when SendGrid is configured.
3. **Auto-reply emailed** to the visitor confirming receipt.

Before go-live, submit a test on `/contact`, sign in as front desk, open **Admin → Contact inbox**, and confirm the message appears. Email to Sean’s Gmail is optional backup, not required for daily workflow.

Add your Vercel hostname and final domain under **Firebase Auth → Settings → Authorized domains** so admin login and password reset work.

## Online booking (no payment required)

Public `/book` works with Firebase + SendGrid only. Turn scheduling on/off under **Admin → Banners & promos → Online booking**. Online Square prepay stays **off** unless you enable it in that panel.

## Square (only if you enable online prepay or admin payment links)

| Variable | What to provide |
|----------|-----------------|
| `SQUARE_ACCESS_TOKEN` | Square Developer dashboard (use **production** token when live) |
| `SQUARE_ENVIRONMENT` | `production` when live (use `sandbox` only for testing) |
| `SQUARE_LOCATION_ID` | Square Dashboard → Locations → Paris location ID |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Square → Webhooks → subscription pointing to `https://YOUR_DOMAIN/api/webhooks/square` |

## Recommended

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Long random string; Vercel Cron uses it for reminder/survey jobs |
| `RATE_LIMIT_SALT` | Random string for booking rate limits |
| `NEXT_PUBLIC_GBP_PARIS_URL` | **Optional.** Direct review link; prefer **Admin → Banners & promos → Online booking** (no redeploy) |
| `NEXT_PUBLIC_GBP_SS_URL` | **Optional.** Same for Sulphur Springs |
| `NEXT_PUBLIC_FACEBOOK_URL` | Already defaulted in code for Paris FB page; override if needed |

## Optional

- `TWILIO_*` — SMS reminders / payment links if you enable texting
- `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` — analytics
- `PUBLIC_BOOKING_PREPAY_*_CENTS` — Square prepay amounts (only if **online payments** enabled in admin)
- **Admin → Banners & promos → Online booking** — turn `/book` on/off, custom “booking disabled” message, optional Square payments toggle, GBP review URLs
- `ADMIN_BOOTSTRAP_SECRET` — one-time only to create first admin; remove after use

## What is GBP?

**GBP = Google Business Profile** (formerly Google My Business). Each office has a listing on Google Maps with hours, phone, photos, and **reviews**.

- **You do not need these in Vercel on day one.** Paste links in **Admin → Online booking**, or leave blank to use Google Maps.
- Vercel env vars override the admin panel if both are set.

How to get the links later: Google Maps → your listing → Share (or “Ask for reviews”) → copy the HTTPS URL.

## DNS (later)

When you are ready:

1. Point your **primary** domain A/CNAME to Vercel.
2. Add the same domains in Vercel → Project → Domains.
3. Point legacy domains (`massageparistexas.com`, `chiropracticsulphursprings.com`) to the same deployment; middleware forwards their homepages automatically.
4. Update `NEXT_PUBLIC_APP_URL` to the primary domain and redeploy.

## Ownership / HIPAA note

This project is scoped as **scheduling and marketing only** (no clinical PHI in the app). You are not required to transfer Firebase/Vercel to the clinic for HIPAA on the developer side if that matches your agreement—keep accounts wherever you prefer, but use a **clinic-owned** `SENDGRID_FROM_EMAIL` and notification inbox for production.
