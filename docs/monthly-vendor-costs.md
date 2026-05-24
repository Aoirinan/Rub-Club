# Monthly vendor costs and API usage

Order-of-magnitude estimates for pass-through vendor bills (clinic) and developer-hosted overhead. **Not invoices** — confirm tiers in each vendor dashboard quarterly.

Pass-through vendors bill the **account owner** ([`two-phase-client-sow.md`](two-phase-client-sow.md)). After [ownership transfer](ownership-transfer-runbook.md), the clinic pays Vercel, Firebase, SendGrid, Twilio, Square, and domains directly.

**Related:** Phase 1 DNS and env — [`dns-prep-checklist.md`](dns-prep-checklist.md), [`production-env-checklist.md`](production-env-checklist.md).

---

## Production baseline (verified)

Last checked: **2026-05-21** (from linked Vercel project + production deployment aliases).

| Vendor | Production value | Plan / tier (confirm in dashboard) | How to verify |
|--------|------------------|-------------------------------------|---------------|
| **Vercel** | Project `rub-club` (`prj_iVGAe3MtIrWOOcm0zX8jmbMfCwtn`) on team `russellforsyth09091992-1735s-projects` | **Likely Hobby** (personal team) — confirm | [Vercel](https://vercel.com) → team **Settings → Billing** |
| **Firebase** | Same project as `NEXT_PUBLIC_FIREBASE_PROJECT_ID` in Production env (preview hostname `project-bav0l.vercel.app` suggests project id may be `project-bav0l`) | **Likely Spark (free)** at Phase 1 volume — confirm | [Firebase Console](https://console.firebase.google.com) → project → **Usage and billing** |
| **SendGrid** | API key + `SENDGRID_FROM_EMAIL` in Vercel Production | **Unknown** — Essentials ~$19.95/mo if paid; often $0 at low volume | SendGrid → **Email API** → plan / stats |
| **Twilio** | Optional (`TWILIO_*` in env) | **$0** while unset or booking off | Twilio → **Monitor → Logs** |
| **Square** | Optional; sandbox vs `production` per `SQUARE_ENVIRONMENT` | **$0 API**; card fees only on successful charges | Square Dashboard → **Transactions** |
| **GA4 / GTM** | Optional `NEXT_PUBLIC_GA_*` | **$0** | N/A |

### Vercel production domains (on deployment)

These hostnames are attached to production (`vercel inspect`):

| Hostname | Role |
|----------|------|
| `wellnessparistx.com`, `www.wellnessparistx.com` | Primary canonical brand |
| `massageparistexas.com`, `www.massageparistexas.com` | Legacy; homepage → `/services/massage` ([`lib/domain-routing.ts`](../lib/domain-routing.ts)) |
| `chiropracticsulphursprings.com`, `www.chiropracticsulphursprings.com` | Legacy; homepage → `/sulphur-springs` |
| `rub-club.vercel.app`, `project-bav0l.vercel.app` | Vercel default / preview-style hostnames |

**Not on Vercel aliases (as of baseline check):** `chiropracticparistexas.com` — SOW expects registrar or Vercel redirect to primary ([`two-phase-client-sow.md`](two-phase-client-sow.md)); add redirect when that domain is renewed.

### Scheduled jobs (fixed monthly invocations)

From [`vercel.json`](../vercel.json):

| Cron | Schedule | API cost impact (Phase 1) |
|------|----------|---------------------------|
| `/api/cron/reminders` | Hourly | **No sends** — route returns `disabled: true` ([`app/api/cron/reminders/route.ts`](../app/api/cron/reminders/route.ts)) |
| `/api/cron/surveys` | Hourly (:15) | Firestore query (≤120 docs) + rare SendGrid survey emails |
| `/api/cron/data-retention` | Weekly Sun 03:00 UTC | **No-op** until `DATA_RETENTION_ENABLED=true` |

Approximate **~1,444** Vercel cron HTTP invocations/month (720 + 720 + 4), plus normal page/API traffic. Well within Hobby limits for a marketing site.

### Baseline checklist (re-run quarterly)

- [ ] Vercel team plan: Hobby / Pro / Enterprise — record: __________
- [ ] Firebase plan: Spark / Blaze — record: __________
- [ ] SendGrid plan name and monthly email count — record: __________
- [ ] Twilio: any outbound SMS last 30 days? Y / N
- [ ] Square: `SQUARE_ENVIRONMENT` = sandbox / production — record: __________
- [ ] Admin → Banners & promos → **Online booking enabled**: Y / N

---

## Domain inventory and renewal budget

Amortize annual registrar fees as **monthly overhead** (whoever owns the registrar account pays).

| Domain | Purpose | On Vercel production? | Typical renewal (USD/yr) | ~Monthly |
|--------|---------|------------------------|---------------------------|----------|
| `wellnessparistx.com` | Primary brand + `NEXT_PUBLIC_APP_URL` | Yes (apex + www) | $12–20 | $1–2 |
| `massageparistexas.com` | Legacy entry → massage section | Yes (apex + www) | $12–20 | $1–2 |
| `chiropracticsulphursprings.com` | Legacy entry → Sulphur hub | Yes (apex + www) | $12–20 | $1–2 |
| `chiropracticparistexas.com` | Legacy Paris chiro brand | Redirect only (not in current Vercel alias list) | $12–20 | $1–2 |

**Registrar:** record where each name is registered (GoDaddy, Cloudflare, Google Domains, etc.): ____________________

**Total domain budget (4 names):** roughly **$48–80/year** → **~$4–7/month**.

**Notes:**

- www variants are usually included with the apex at most registrars.
- Vercel can manage DNS for domains added in **Project → Domains**; renewal may still be at the registrar unless transferred to Vercel Domains.
- Keep `NEXT_PUBLIC_APP_URL` aligned with the primary hostname after DNS changes.

---

## Phase 1 — marketing only (booking OFF)

Typical clinic pass-through: **~$0–15/month** (domains dominate; APIs effectively $0).

| Line item | Estimate | Driver in this repo |
|-----------|----------|---------------------|
| Vercel | $0 (Hobby) | Static/marketing traffic + crons above |
| Firebase | $0 (Spark) | Contact inbox, site content, staff Auth, hourly survey query |
| SendGrid | $0–20 | Contact: office copy + visitor auto-reply ([`app/api/contact/route.ts`](../app/api/contact/route.ts)); staff invites; post-visit surveys |
| Twilio | $0 | No public booking SMS |
| Square | $0 | No prepay without admin toggle + env |
| Domains | ~$4–7/mo | Table above |
| Analytics | $0 | Optional GA4/GTM |

**Developer overhead (while hosting accounts):** same **~$3–15/mo** pass-through for domains/SendGrid if on your card, plus **retainer** (contract) and optional **tech E&O** (~$500–1,500/yr amortized — see [`hipaa-compliance-checklist.md`](hipaa-compliance-checklist.md)).

---

## Phase 2 — when online booking is ON

Re-estimate when **Admin → Banners & promos → Online booking enabled** is checked. Variable costs are **email, SMS, Firestore reads, and Square card fees**.

### Per booking (automatic on successful public book)

From [`app/api/bookings/route.ts`](../app/api/bookings/route.ts):

| Action | Count | Vendor |
|--------|-------|--------|
| Office notification email | 0–1 | SendGrid (`OFFICE_NOTIFICATION_EMAIL`) |
| Patient confirmation email (+ `.ics`) | 1 | SendGrid |
| Booking confirmation SMS | 1 | Twilio (~$0.0083/segment US + ~$1.15/mo for number) |
| Firestore writes | Several | Firebase (booking, events, slot buckets, patient) |
| Square payment link (optional) | 0–1 API call | Square API free; **2.6% + $0.10** (typical) when patient pays |

Staff actions (accept, decline, cancel, remind, charge) add more SendGrid and/or Twilio messages per action.

### Slot browsing (Firestore reads)

[`app/api/slots/route.ts`](../app/api/slots/route.ts) checks each candidate time with `getAll` on `slot_buckets` documents. A patient changing dates in the wizard can generate **tens to hundreds of reads per session** — usually still within Spark free tier unless traffic is very high.

### Volume scenarios (monthly, approximate)

| Online bookings/mo | SendGrid emails | Twilio SMS | Firebase | Square |
|--------------------|-----------------|------------|----------|--------|
| **20** | ~40–80 + staff mail → often **$0** | ~20 + number → **~$1–2** | Often **$0** | Fees only on successful prepays |
| **80** | ~160+ → **$0–20** | **~$6–10** | Watch usage dashboard | Scales with prepay $ volume |

### Monitoring checklist (booking ON)

Run monthly for the first quarter after enabling booking, then quarterly.

1. **SendGrid** → Activity: count emails; compare to plan limit (Essentials 50k/mo if paid).
2. **Twilio** → Messaging → Outbound: segment count × ~$0.0083; confirm one US long code/month.
3. **Firebase** → Usage: Firestore **reads** (watch `/api/slots` traffic); writes (bookings + admin).
4. **Vercel** → Usage: serverless invocations and bandwidth spikes after marketing campaigns.
5. **Square** → Transactions: processing fees vs gross prepay (not an API subscription).
6. **Admin** → note average online bookings/month: __________

### HIPAA / PHI scope (not Phase 1)

If scope later includes PHI in the app, budget **+$50–150+/mo** for Vercel Pro + HIPAA add-on, Firebase Blaze + Google HIPAA BAA, and upgraded email — see [`hipaa-compliance-checklist.md`](hipaa-compliance-checklist.md).

---

## Bottom line

| Who | Phase 1 (booking OFF) | Booking ON (moderate volume) |
|-----|------------------------|------------------------------|
| **Clinic vendors** | **~$0–15/mo** | **~$5–35/mo** + Square % on prepays |
| **Developer pass-through** | **~$3–15/mo** + retainer/insurance | Same + monitor Twilio/SendGrid |
| **API meter charges** | Effectively **$0** | SMS + possible SendGrid tier |

Update the **Production baseline** table date whenever you re-run the quarterly checklist.
