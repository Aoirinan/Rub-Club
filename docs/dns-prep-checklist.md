# DNS prep (before you flip the switch)

> **Going back?** See [`dns-restore-point.md`](./dns-restore-point.md) for a snapshot of every
> current DNS record and the rollback procedure for each failure case. Export the Cloudflare
> zone files **before** changing anything.

You can do almost everything below **while the site still runs on `rub-club.vercel.app`**. None of this requires turning on online booking.

## Phase 1 — marketing (now)

| Task | Where |
|------|--------|
| Keep **online booking off** | Admin → Banners & promos → Online booking → uncheck **Online booking enabled** |
| Paste **Google review URLs** | Same tab → Save review URLs |
| Edit **site copy / photos** | Admin → **Website** (managers+) |
| Edit **massage team** (Meet the team) | Admin → **Website** → **Massage** page |
| Edit **Paris / Sulphur staff** (copy + roster) | Admin → **Website** → **Paris staff** / **Sulphur staff** |
| Edit **doctor names, titles, bios, photos** | Admin → **Website** → **Doctors (global)** |
| Edit **Paris office hours** | Admin → **Website** → **Paris office** → Office hours |
| Edit **Sulphur hours** | Admin → **Website** → **Sulphur Springs** page or **Sulphur subpages** |
| Show/hide **dark header phone bar** (above logos) | Admin → Website editor → **Footer** → Header → “Show dark phone bar above logos” |
| Banners & specials | Admin → Banners & promos |
| Gift card link | Admin → Other extras (or env `nav_giftcard_url` in CMS) |
| Test all public pages on Vercel URL | Home, services, Sulphur hub, locations, reviews, contact |
| Confirm header says **Contact us** (not Book Now) when booking is off | After latest deploy |

**Skip for phase 1:** Square, booking confirmation emails, SMS, cron reminders, provider schedules for public `/book`.

## Vercel & Firebase (safe to do early)

### Add domain in Vercel (what the modal means)

1. Go to **Project → Settings → Domains → Add**.
2. Type **`chiropracticparistexas.com`** (no `https://`).
3. Leave **“Redirect chiropracticparistexas.com to www…”** checked if you want `www` as the main address (recommended).
4. Select **Connect to an environment** → **Production** (not Preview).
5. Click **Save**.
6. Repeat for **`www.chiropracticparistexas.com`** if you only added the apex first — or add both in one flow if Vercel offers it.
7. After Save, Vercel shows **DNS records** (CNAME/A). Copy those into your registrar — the domain will show “Invalid configuration” until DNS propagates; that is normal.

Do **not** choose “Redirect to Another Domain” unless you are forwarding to a completely different website.

1. Add **production domain** in Vercel → Domains (can stay on “Invalid configuration” until DNS points).
2. Confirm **`NEXT_PUBLIC_APP_URL`** is **`https://www.chiropracticparistexas.com`** now, before DNS moves — never the `*.vercel.app` URL. Only the host it names may be indexed, so a Vercel URL there would mark the real domain `noindex` after cutover (details: [production-env-checklist.md](production-env-checklist.md#why-next_public_app_url-is-never-the-vercel-url)). If you change it, redeploy.
3. Firebase Auth → **Authorized domains** (Authentication → Settings):
   - **Vercel:** `rub-club.vercel.app`, `project-bav0l.vercel.app` (if you use that hostname)
   - **Primary:** `chiropracticparistexas.com`, `www.chiropracticparistexas.com`
   - **Legacy (admin login on old brands):** `massageparistexas.com`, `www.massageparistexas.com`, `chiropracticsulphursprings.com`, `www.chiropracticsulphursprings.com`
   - Defaults (`localhost`, `*.firebaseapp.com`, `*.web.app`) stay as-is
4. Optional: add `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_GTM_ID` for analytics on the marketing site.

## DNS cutover day (when ready)

1. Point **A/CNAME** for primary domain to Vercel (per Vercel’s DNS instructions).
2. Add **legacy** domains to the **same** Vercel project (Project → Settings → Domains) as **normal domains** — **not** the "Redirect to" dropdown (that only does root-to-root and can't target a section). Once their traffic reaches this deployment, `next.config.ts` `redirects()` permanently redirects **all paths** cross-domain — each old page to its own new page ([legacy-redirect-map.csv](legacy-redirect-map.csv)), anything else to the section:
   - `massageparistexas.com` / `www` → `https://www.chiropracticparistexas.com/services/massage`
   - `chiropracticsulphursprings.com` / `www` → `https://www.chiropracticparistexas.com/sulphur-springs`
3. Wait for SSL “Ready” on all domains in Vercel.
4. Check `NEXT_PUBLIC_APP_URL` is still `https://www.chiropracticparistexas.com` (no change or redeploy needed if so).
5. Smoke test: home, contact, reviews, one service page, admin login on the new hostname.

## Phase 2 — scheduler & payments (later)

- Turn on **online booking** in admin when providers and schedules are ready.
- Square env vars + optional prepay cents.
- SendGrid / office notification tuning, Twilio, cron `CRON_SECRET`.
- HIPAA / BAA / account ownership as agreed with the clinic.

See also: `docs/production-env-checklist.md`.
