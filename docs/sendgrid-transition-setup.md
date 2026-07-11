# SendGrid transition email setup (developer domain → clinic domain)

Use this during **Phase 1–2B** while the clinic website DNS still points at the legacy host and you do not have clinic GoDaddy access. After handoff, follow **Phase B** in [`production-env-checklist.md`](production-env-checklist.md).

## Recommended transition domain for this project

**`massageparistx.com`** — GoDaddy Email Essentials (you control DNS). Use:

| Role | Address |
|------|---------|
| **SendGrid FROM** (system mail) | `scheduling@massageparistx.com` |
| **Reply-To** (human replies) | `scheduling@massageparistx.com` (same mailbox; clinic inbox after cutover) |
| **Display name** (inbox label) | `Chiropractic Associates · The Rub Club` — set via `SENDGRID_FROM_NAME` or default in code |

Inbox display name stays clinic-branded; only the **@domain** is yours until cutover.

---

## Step 1B — Domain authentication on massageparistx.com (recommended)

Do this after Single Sender works. Adds **SPF, DKIM, and DMARC** so Outlook/Gmail trust mail from `scheduling@massageparistx.com` (fewer junk-folder warnings, no “via sendgrid.net”).

**Does not break GoDaddy Email** — you add CNAME/TXT records on subdomains; leave existing **MX** records alone.

### SendGrid

1. **Settings → Sender Authentication → Authenticate Your Domain**
2. If offered **Automated Setup** with GoDaddy, sign in and let SendGrid add records (fastest). Otherwise choose **Manual setup** and **GoDaddy** as DNS host.
3. Domain: **`massageparistx.com`** (not `www`)
4. Leave **Automated security** ON (default)
5. **Link branding:** skip for now (optional later)
6. Copy the DNS records SendGrid shows (usually **3 CNAME + 1 TXT** for DMARC)

### GoDaddy DNS (manual)

1. GoDaddy → **My Products** → **massageparistx.com** → **DNS** (or **Manage DNS**)
2. For each SendGrid record, click **Add**:
   - **Type:** CNAME or TXT (match SendGrid)
   - **Name / Host:** enter **only the part before** `.massageparistx.com`  
     GoDaddy appends the domain automatically. Wrong: `em1234.massageparistx.com` → becomes double domain and fails.  
     Right examples:

     | SendGrid shows host | Enter in GoDaddy **Name** |
     |---------------------|---------------------------|
     | `em1234.massageparistx.com` | `em1234` |
     | `s1._domainkey.massageparistx.com` | `s1._domainkey` |
     | `s2._domainkey.massageparistx.com` | `s2._domainkey` |
     | `_dmarc.massageparistx.com` (TXT) | `_dmarc` |

   - **Value / Points to:** paste SendGrid’s value exactly (often ends in `.sendgrid.net`)
   - **TTL:** default (1 hour) is fine
3. **Do not** delete or edit existing **MX** records (GoDaddy mailbox mail)

### Verify

1. Back in SendGrid → **Verify**
2. Propagation can take **5 minutes–48 hours**; retry Verify if needed
3. Status should show **Verified** for the domain
4. No Vercel changes — keep `sendgridfromemail` = `scheduling@massageparistx.com`
5. Send a password reset from **Team logins** (superadmin); check inbox (not junk)

### Gmail still spam on staff invites?

Invite links default to `firebaseapp.com` while mail is from `scheduling@massageparistx.com` — Gmail treats that as suspicious.

1. Deploy app (includes `/auth/action` password handler on your site).
2. **Firebase Console → Authentication → Templates → Customize action URL** → `https://rub-club.vercel.app/auth/action` (or production URL + `/auth/action`).
3. Re-send invite; link should use `rub-club.vercel.app`, not `firebaseapp.com`.

See [`production-env-checklist.md`](production-env-checklist.md) → Staff invite deliverability.

---

## Step 1 — SendGrid Single Sender (use this now)

No DNS changes. Good until the clinic website/domain is transferred.

1. Wait until GoDaddy finishes setting up **`scheduling@massageparistx.com`** (you can sign in and receive mail).
2. SendGrid → **Settings → Sender Authentication → Verify a Single Sender**.
3. Use:
   - **From email:** `scheduling@massageparistx.com`
   - **From name:** `Chiropractic Associates · The Rub Club`
   - **Reply to:** `scheduling@massageparistx.com`
4. SendGrid sends a confirmation link to **scheduling@** — open it in GoDaddy webmail.
5. When status is **Verified**, delete the old **Seans App** sender (`russell_forsyth_1992@outlook.com`) from Single Senders if still present.

---

## Step 1 (legacy note) — Single Sender only

Single Sender is enough to **send** mail. For **inbox delivery**, complete **Step 1B** (domain authentication) above.

---

## Step 2 — Vercel Production environment

After SendGrid shows **`scheduling@massageparistx.com` Verified** (Single Sender):

| Variable | Value |
|----------|--------|
| `sendgridfromemail` | `scheduling@massageparistx.com` |
| `SENDGRID_REPLY_TO` | `scheduling@massageparistx.com` |
| `SENDGRID_FROM_NAME` | `Chiropractic Associates · The Rub Club` (optional; same as code default) |
| `send_grid` | Unchanged — SendGrid API key |
| `OFFICE_NOTIFICATION_EMAIL` | Unchanged — where contact/booking **copies** go (`dr.seanwelborn@gmail.com`) |

Redeploy production (or trigger redeploy from Vercel dashboard).

---

## Step 3 — Verify in admin

1. Sign in → **Admin → Scheduling & team** → **Email delivery**.
2. Confirm **FROM address** shows `scheduling@massageparistx.com`.
3. Click **Send test email to me**.
4. Test **Send password reset** from Admin **Team logins** and submit `/contact` once.

Mail should arrive from **Chiropractic Associates · The Rub Club** without “via sendgrid.net” on a personal mailbox.

---

## Phase B — Clinic domain cutover (when GoDaddy/host access is ready)

Do **not** create `@chiropracticparistexas.com` mail in the wrong account. When you control clinic DNS:

1. Check existing MX records and mailboxes (`info@`, `scheduling@`) with the current host — avoid conflicts.
2. SendGrid → **Authenticate Your Domain** → `chiropracticparistexas.com` (or verify Single Sender for `scheduling@chiropracticparistexas.com`).
3. Vercel Production — update only:
   - `sendgridfromemail` → `scheduling@chiropracticparistexas.com`
   - `SENDGRID_REPLY_TO` → clinic scheduling inbox
4. Redeploy and repeat admin email tests.
5. Optional: remove `massageparistx.com` from SendGrid if unused.

At full handoff, rotate `SENDGRID_API_KEY` to the clinic SendGrid account per [`ownership-transfer-runbook.md`](ownership-transfer-runbook.md).

---

## What sends on each FROM (Phase 1 vs 2B)

| Phase | Emails |
|-------|--------|
| **Phase 1** (booking off) | Contact auto-reply + office copy; staff invite; forgot password |
| **Phase 2B** (booking on) | Above + booking confirmations, reminders, cancel/accept, payment links |

Use an authenticated transition domain **before** turning on public booking.
