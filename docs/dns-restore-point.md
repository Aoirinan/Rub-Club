# DNS restore point — how to put everything back

Companion to `dns-prep-checklist.md`. That one covers moving **forward** to the new site.
This one covers going **back**, if the cutover has to be reversed.

Captured **2026-09-10** from public DNS lookups and a read-only review of the GoDaddy
account. Nothing was changed to produce it.

---

## The short version

If the cutover is done the recommended way — changing only the **address records inside
Cloudflare**, leaving the nameservers alone — then rolling back means putting those
address records back to what they were. Mail is never touched, so email keeps working
throughout, including during a failed cutover.

Everything else in this document is insurance for the less likely cases.

---

## 1. Domains, registrars, and where DNS is actually edited

| Domain | Registrar | Nameservers / DNS edited at | Expires |
|---|---|---|---|
| chiropracticparistexas.com | GoDaddy | Cloudflare (`arya` + `david.ns.cloudflare.com`) | Oct 2, 2030 |
| massageparistexas.com | GoDaddy | Cloudflare (same pair) | Oct 2, 2030 |
| chiropracticsulphursprings.com | **Register.com / Network Solutions** | Cloudflare (same pair) | **Feb 21, 2027** |
| myhappyback.net | GoDaddy | GoDaddy (`ns51` + `ns52.domaincontrol.com`) | Oct 2, 2030 |
| rubclubparistexas.com | GoDaddy | GoDaddy (same pair) | Oct 2, 2030 |

Nameservers are changed at the **registrar**. For the Sulphur Springs domain that means
Network Solutions, not GoDaddy.

---

## 2. Current record values

### chiropracticparistexas.com

| Name | Type | Value |
|---|---|---|
| `@` | A | `172.67.212.159`, `104.21.53.116` — *Cloudflare proxy addresses, see the warning below* |
| `@` | AAAA | `2606:4700:3030::6815:3574`, `2606:4700:3033::ac43:d49f` |
| `www` | A / AAAA | same as `@` |
| `@` | **MX** | `smtp.secureserver.net` priority **0** |
| `@` | **MX** | `mailstore1.secureserver.net` priority **10** |
| `@` | TXT | `google-site-verification=ExLSJmaFlS9ssNnpZ_JgdEqbUL4g-atBh5xp5coD6Lc` |

### massageparistexas.com

| Name | Type | Value |
|---|---|---|
| `@` | A | `172.67.186.58`, `104.21.80.151` — *Cloudflare proxy addresses* |
| `@` | AAAA | `2606:4700:3035::6815:5097`, `2606:4700:3030::ac43:ba3a` |
| `www` | A / AAAA | same as `@` |
| `@` | **MX** | `smtp.secureserver.net` priority **0** |
| `@` | **MX** | `mailstore1.secureserver.net` priority **10** |

### chiropracticsulphursprings.com

| Name | Type | Value |
|---|---|---|
| `@` | A | `172.67.211.136`, `104.21.61.154` — *Cloudflare proxy addresses* |
| `@` | AAAA | `2606:4700:3035::6815:3d9a`, `2606:4700:3031::ac43:d388` |
| `www` | A / AAAA | same as `@` |
| — | MX | **none** — this domain has no email |

`ftp` and `email` also resolve on the first two domains, but only to the same proxied
website, so they need no separate entry.

### The warning about those addresses

The A records above are **Cloudflare's**, not the practice's real server. Cloudflare sits
in front and hides the true origin. Putting those addresses into a different DNS host will
**not** restore the old vendor site — it would point at Cloudflare for a zone Cloudflare no
longer serves.

So they are useful for one thing only: confirming nothing changed. They are not a backup of
the old site.

**The real origin address is only visible inside the Cloudflare dashboard.** Which is why
step 3 matters.

---

## 3. Do this BEFORE touching anything

Two minutes of work that makes every rollback trivial.

1. **Export the Cloudflare zone file.** Cloudflare → pick the domain → DNS → Records →
   **Export**. Downloads the complete zone, including the hidden origin values and any
   record not guessable from outside. Cloudflare can import the same file to restore it.
   Do this for all three domains. Keep the files with the practice's records, not only on
   one laptop.
2. **Note the non-DNS Cloudflare settings**, which an export does not include and which
   change how the site behaves:
   - SSL/TLS encryption mode (Flexible / Full / Full Strict)
   - Any Page Rules or Redirect Rules — these often perform the `www` redirect
   - Whether each record is proxied (orange cloud) or DNS-only (grey)
   - Any Workers or Bulk Redirects
   A screenshot of each screen is enough.
3. **Export the GoDaddy zones** for `myhappyback.net` and `rubclubparistexas.com` the same
   way, if either is ever going to be touched.
4. **Lower the record TTL to 5 minutes** a day ahead, so both the change and any rollback
   take effect quickly instead of being cached for hours.

Without step 1, a full rebuild is still possible from section 2, but the old vendor site
cannot be restored — only the new site or nothing.

---

## 4. Rollback, by scenario

### A. The new site is live but something is wrong — most likely case

Change the address records in Cloudflare back to their previous values (from the export in
step 1) and wait out the TTL. With a 5-minute TTL the old site is back within minutes.
Mail was never touched.

### B. Cloudflare is unavailable, but the domains still resolve

Nothing is broken yet, so there is no rush. Plan a nameserver move at the registrar during
a quiet period, using section 5.

### C. Cloudflare zone deleted — domains stop resolving entirely

Website **and** email both stop, because the mail records live in that zone. Recover by
moving nameservers at the registrar and rebuilding, per section 5. This is the only
scenario with real urgency, and it is why establishing who owns the Cloudflare account
matters before anyone cancels the old vendor.

---

## 5. Rebuilding a zone from scratch at GoDaddy

Only needed for scenario C, or a deliberate move off Cloudflare.

1. At the registrar, set the nameservers to GoDaddy's (`ns51.domaincontrol.com`,
   `ns52.domaincontrol.com`). Sulphur Springs is done at Network Solutions.
2. In GoDaddy DNS, recreate for each domain:
   - **MX records exactly as listed in section 2** — do this first. Email is the part with
     no workaround.
   - The TXT verification record on the Paris domain.
   - Address records for `@` and `www` pointing at **Vercel**, following Vercel's own
     instructions in Project → Settings → Domains. Do not reuse the Cloudflare addresses
     from section 2.
3. Send a test message to a real mailbox on the domain and confirm it arrives, before
   moving on to anything else.

A nameserver change can take a few hours to settle, unlike a record change.

---

## 6. What is deliberately not in scope

- **EZBIS** — the practice's scheduling and practice-management software. It does not
  appear anywhere in these domains' DNS and the current website does not link to it, so
  none of the above can affect it. The one indirect risk is mail authentication: if EZBIS
  sends appointment reminders from a practice address, adding an SPF record later without
  listing EZBIS as an approved sender would send those reminders to spam. There is no SPF,
  DKIM or DMARC record on any of these domains today.
- **myhappyback.net** — forwards to the main site by name, so it keeps working after the
  cutover with no change.
- **rubclubparistexas.com** — currently serves "Site Not Found" from an unpublished GoDaddy
  website product. Already broken; the cutover neither helps nor hurts it.
