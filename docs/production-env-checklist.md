# Production launch — what we need from you

Use this when deploying to Vercel (or similar). Copy `env.example` to Vercel **Production** environment variables. Nothing here requires DNS to be on the new domains yet—you can use the Vercel `*.vercel.app` URL for testing.

## Required for the site to work

| Variable | What to provide |
|----------|-----------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full JSON from Firebase → Project settings → Service accounts → Generate new private key |
| `NEXT_PUBLIC_FIREBASE_*` | Web app config from Firebase console (API key, auth domain, project ID, storage bucket) |
| `NEXT_PUBLIC_APP_URL` | Your live URL with `https://` and no trailing slash (e.g. `https://www.chiropracticparistexas.com` or the Vercel URL until DNS is ready) |
| `SENDGRID_API_KEY` | From SendGrid → API Keys |
| `SENDGRID_FROM_EMAIL` | A **verified** sender in SendGrid — see [Transition email](#transition-email-developer-domain--clinic-domain) below |
| `SENDGRID_REPLY_TO` | Inbox that receives **replies** to system mail (`scheduling@massageparistx.com` now; clinic scheduling inbox after cutover) |
| `SENDGRID_FROM_NAME` | Optional display name in inboxes (default: `Chiropractic Associates · The Rub Club`) |
| `OFFICE_NOTIFICATION_EMAIL` | Optional email copies for bookings + contact form. Use **`dr.seanwelborn@gmail.com`**. Front desk should use **Admin → Contact inbox**, not email. |

## Transition email (developer domain → clinic domain)

During Phase 1–2B the clinic website may still live on the legacy host and clinic DNS may be unavailable. Send system mail from **a domain you control**, then swap one env var when the clinic domain is ready.

**Full steps:** [`sendgrid-transition-setup.md`](sendgrid-transition-setup.md)

### Phase A — Now (your domain)

| Variable | Transition value |
|----------|------------------|
| `sendgridfromemail` | `scheduling@massageparistx.com` (after SendGrid domain auth on that domain) |
| `SENDGRID_REPLY_TO` | `scheduling@massageparistx.com` |
| `SENDGRID_FROM_NAME` | `Chiropractic Associates · The Rub Club` |
| `OFFICE_NOTIFICATION_EMAIL` | Unchanged — **recipient** for office copies, not the visible sender |

SendGrid → **Verify a Single Sender** for `scheduling@massageparistx.com` (no DNS changes). When GoDaddy mailbox is ready, confirm the link → update Vercel `sendgridfromemail` → redeploy.

Admin → **Email delivery** shows the current FROM address and warns if still on a personal mailbox (Outlook/Gmail).

### Phase B — Clinic cutover (when GoDaddy/host access is ready)

- [ ] Check clinic MX records and existing mailboxes — do not break current host email
- [ ] SendGrid → authenticate `chiropracticparistexas.com` (or verify `scheduling@chiropracticparistexas.com`)
- [ ] Vercel: `sendgridfromemail` → `scheduling@chiropracticparistexas.com`
- [ ] Vercel: `SENDGRID_REPLY_TO` → clinic scheduling inbox
- [ ] Redeploy; test from Admin **Email delivery**, `/contact`, staff invite
- [ ] At handoff: new `SENDGRID_API_KEY` on clinic SendGrid account ([ownership transfer](ownership-transfer-runbook.md))

**Do not** use personal Outlook/Gmail as `SENDGRID_FROM_EMAIL` in production — it lands in spam and shows “via sendgrid.net”.

## Contact form (required for handoff)

Every public `/contact` submission is:

1. **Saved in Firestore** (`contact_submissions`) — **front desk checks Admin → Contact inbox** after staff sign-in (all roles, including front desk).
2. **Optional email copy** to `OFFICE_NOTIFICATION_EMAIL` (`dr.seanwelborn@gmail.com`) when SendGrid is configured.
3. **Auto-reply emailed** to the visitor confirming receipt.

Before go-live, submit a test on `/contact`, sign in as front desk, open **Admin → Contact inbox**, and confirm the message appears. Email to Sean’s Gmail is optional backup, not required for daily workflow.

Add your Vercel hostname and final domain under **Firebase Auth → Settings → Authorized domains** so admin login, password reset, and staff invite links work. For this project add at minimum:

- `rub-club.vercel.app` (Vercel production URL until custom DNS is primary)
- `localhost` (local development)
- Your production domain when live (e.g. `www.chiropracticparistexas.com`)

If staff invites fail with **“Domain not allowlisted by project”**, the domain in the error is missing from that Firebase list — not a SendGrid issue.

## Staff login security (Firebase Console)

Recommended settings under **Firebase → Authentication → Settings**:

| Setting | Action |
|---------|--------|
| Authorized domains | `rub-club.vercel.app`, `localhost`, production domain |
| Password policy | Enforce minimum 8 characters with complexity |
| Email enumeration protection | Enable (recommended) |

### App Check (optional, invisible bot protection)

1. Google Cloud → enable **reCAPTCHA Enterprise**
2. Create a **score-based** website key for `rub-club.vercel.app` and your production domain (no checkbox challenge)
3. Firebase → **App Check** → register the web app with that key
4. Set `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` in Vercel and redeploy
5. Run in **monitoring** mode first; enable **enforcement** for Authentication after a few days of clean traffic

Staff **password reset** is superadmin-only: **Scheduling & team → Team logins → Send password reset** (`POST /api/admin/staff/send-password-reset`, rate-limited, SendGrid when configured). Self-service forgot password on `/admin/login` is disabled (`POST /api/admin/forgot-password` returns 403).

## Staff invite email deliverability (spam / junk folder)

Gmail often files staff invites in **Spam** even when SendGrid domain auth is verified, because:

1. **Link domain mismatch** — the reset button pointed at `*.firebaseapp.com` while mail comes from `scheduling@massageparistx.com` (looks like phishing).
2. **New sender reputation** — `massageparistx.com` is still building trust with Gmail.
3. **Password / invite wording** — transactional account emails get extra scrutiny.

### Fix link domain (recommended)

1. Deploy the app with the custom handler at **`/auth/action`** (included in this repo).
2. **Firebase Console** → **Authentication** → **Templates** → open any email template → **Customize action URL** → set:
   - `https://rub-club.vercel.app/auth/action` (or your production `NEXT_PUBLIC_APP_URL` + `/auth/action`)
3. Save. **New** invite and admin-initiated password reset links from the app will use your Vercel domain instead of `firebaseapp.com`.
4. Re-send the staff invite and test in Gmail.

Ensure that same hostname is in **Firebase Auth → Settings → Authorized domains**.

### Already done / still helps

- **SendGrid domain authentication** on `massageparistx.com` (SPF/DKIM/DMARC)
- `sendgridfromemail` = `scheduling@massageparistx.com`
- Ask the recipient to open once from Spam → **Report not spam**
- [Google Postmaster Tools](https://postmaster.google.com/) — add `massageparistx.com` to monitor reputation

### Later (clinic go-live)

Authenticate `chiropracticparistexas.com` in SendGrid and set the Firebase action URL + `NEXT_PUBLIC_APP_URL` to the clinic production domain.

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

## Monthly vendor costs

See [`monthly-vendor-costs.md`](monthly-vendor-costs.md) for production baseline (Vercel/Firebase/SendGrid), domain renewal budget, Phase 1 estimates, and what to re-check when online booking is enabled.
