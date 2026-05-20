# DNS prep (before you flip the switch)

You can do almost everything below **while the site still runs on `rub-club.vercel.app`**. None of this requires turning on online booking.

## Phase 1 — marketing (now)

| Task | Where |
|------|--------|
| Keep **online booking off** | Admin → Banners & promos → Online booking → uncheck **Online booking enabled** |
| Paste **Google review URLs** | Same tab → Save review URLs |
| Edit **site copy / photos** | Admin → Site content |
| Banners & specials | Admin → Banners & promos |
| Gift card link | Admin → Other extras (or env `nav_giftcard_url` in CMS) |
| Test all public pages on Vercel URL | Home, services, Sulphur hub, locations, reviews, contact |
| Confirm header says **Contact us** (not Book Now) when booking is off | After latest deploy |

**Skip for phase 1:** Square, booking confirmation emails, SMS, cron reminders, provider schedules for public `/book`.

## Vercel & Firebase (safe to do early)

1. Add **production domain** in Vercel → Domains (can stay on “Invalid configuration” until DNS points).
2. Set **`NEXT_PUBLIC_APP_URL`** to your **final** primary domain (e.g. `https://wellnessparistx.com`) — do this **right before** or **when** DNS goes live, then redeploy once.
3. Firebase Auth → **Authorized domains**: add `rub-club.vercel.app`, preview URLs if needed, and your future custom domain(s).
4. Optional: add `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` for analytics on the marketing site.

## DNS cutover day (when ready)

1. Point **A/CNAME** for primary domain to Vercel (per Vercel’s DNS instructions).
2. Point **legacy** domains to the **same** Vercel project:
   - `massageparistexas.com` → redirects to `/services/massage` (homepage only)
   - `chiropracticsulphursprings.com` → redirects to `/sulphur-springs` (homepage only)
3. Wait for SSL “Ready” on all domains in Vercel.
4. Set `NEXT_PUBLIC_APP_URL` to primary domain → **production redeploy**.
5. Smoke test: home, contact, reviews, one service page, admin login on the new hostname.

## Phase 2 — scheduler & payments (later)

- Turn on **online booking** in admin when providers and schedules are ready.
- Square env vars + optional prepay cents.
- SendGrid / office notification tuning, Twilio, cron `CRON_SECRET`.
- HIPAA / BAA / account ownership as agreed with the clinic.

See also: `docs/production-env-checklist.md`.
