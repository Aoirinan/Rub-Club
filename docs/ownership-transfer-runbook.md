# Ownership transfer runbook

How to hand the production accounts off so the **clinic** owns the website, app, and data, while the developer keeps **collaborator access only** for ongoing work.

> Goal: after transfer, the clinic is the account holder of record on every vendor below. The developer is a delegated user, not the billing/owner. This removes the developer from the "host of PHI" position and aligns with the [HIPAA compliance posture](./hipaa-compliance-checklist.md).

## Pre-transfer prep

- [ ] Sign the [services / retainer agreement](./services-retainer-agreement-template.md) so ongoing work is clearly contracted.
- [ ] Clinic creates one **business email** address that will be the canonical "account owner" identity (e.g. `owner@chiropracticassociates.com`). Avoid personal Gmail.
- [ ] Clinic enables **2-factor authentication** on that business email (use authenticator app, not SMS).
- [ ] Clinic creates a **password manager** entry (1Password Teams, Bitwarden, etc.) and shares it with the developer for ongoing support access. Do **not** put credentials in email.
- [ ] Inventory current account list (below). Fill in the table as accounts are transferred.

## Account inventory & transfer steps

### 1. GitHub repository (source code)

Current owner: developer  → transfer to: **clinic GitHub organization**

1. Clinic creates a free GitHub organization owned by the business email.
2. Developer: **Settings → General → Transfer ownership** on the repo to the clinic org.
3. Add developer back as a member of the org with **Maintain** role on the repo.
4. Update any deploy webhooks/secrets (Vercel auto-reconnects).

### 2. Vercel project (hosting + CI)

Current owner: developer Hobby/Pro account → transfer to: **clinic Vercel team**

1. Clinic signs up for **Vercel Pro** (required if PHI ever flows; recommended even for scheduling-only for SLAs and roles). Use the business email.
2. Developer: in Vercel, project **Settings → General → Transfer Project** → choose the clinic's team.
3. Re-add the developer as a **Member** on the clinic team (not Owner).
4. Verify all environment variables transferred. Re-enter any that didn't.
5. Confirm the **production domain** still resolves; rotate any leaked secrets just in case.
6. (If scope ever includes PHI) enable Vercel's HIPAA add-on and sign the BAA — billing remains under the clinic.

### 3. Firebase / Google Cloud project (database + storage + auth)

Current owner: developer Google account → transfer to: **clinic Google Workspace**

1. Clinic creates Google Workspace under the business domain (or upgrades existing). $7/mo Business Starter is enough.
2. Developer: in [Google Cloud Console](https://console.cloud.google.com/) → **IAM & Admin → IAM** add the clinic owner email as **Owner** of the project.
3. Clinic: in **Billing**, attach a billing account owned by the clinic's payment method, then **detach** the developer's old billing account.
4. Developer: downgrade self from **Owner** to **Editor** (or **Viewer** + specific roles you actually need for support).
5. In Firebase Console: **Project Settings → Users and permissions**, confirm clinic owner is **Owner** and developer is **Editor**.
6. Re-issue any service-account keys if they were embedded in the developer's accounts; rotate API keys.
7. (If scope ever includes PHI) clinic accepts the [Google Cloud HIPAA BAA](https://cloud.google.com/terms/hipaa-baa) from the clinic's billing account, not the developer's.

### 4. Domain registrar (DNS / custom domain)

Current owner: developer or third party → transfer to: **clinic registrar account**

1. Clinic creates an account at a registrar (Namecheap, Cloudflare, Google Domains migration → Squarespace, etc.).
2. Current registrant unlocks the domain and provides the **EPP / auth code**.
3. Clinic initiates the inbound transfer using the auth code; confirm via the new registrant's contact email.
4. After transfer, **re-point DNS records** for production. Verify TLS still works (Vercel re-issues automatically).
5. Add the developer as a **delegated user** for support, not full account owner.

### 5. SendGrid / email vendor (transactional email)

Current owner: developer → transfer to: **clinic billing account**

1. Clinic creates a SendGrid account under the business email.
2. Re-verify the sender domain on the clinic account (DNS records — easy now that the domain is also on the clinic account).
3. Generate a new SendGrid API key on the clinic account → update Vercel env var (`SENDGRID_API_KEY`).
4. Delete the old developer's SendGrid account (or downgrade to free) so it can no longer send for the domain.
5. **Confirmation:** SendGrid is **not** HIPAA-eligible. Confirm outbound emails contain no clinical PHI — booking confirmations may include name + appointment time (acceptable for scheduling-only scope; discuss with counsel if you ever broaden scope).

### 6. Square / payments

Current owner: clinic (already) → keep as is

- Confirm Square account is in the clinic's legal name and tax ID.
- Re-issue Square API credentials and update Vercel env (`SQUARE_ACCESS_TOKEN`, location ID, etc.).
- Webhook secret should also rotate.

### 7. Twilio / SMS (if used)

Same pattern as SendGrid: clinic owns the account and the phone number, developer is a delegated user. Phone-number porting takes ~1–2 weeks; plan around it.

### 8. Analytics / monitoring (if used)

- Vercel Analytics, Speed Insights, Sentry, Google Analytics, etc. — all under the clinic's billing.
- Disable any feature that could capture booking submissions or admin form values verbatim (request body logging). The website is scheduling-only, but minimum-necessary is still the rule.

### 9. Backups

- Set up an **automated weekly Firestore export** to a Cloud Storage bucket in the clinic's project, with a 90-day lifecycle rule.
- Document retention: the clinic decides how long to keep appointment records (typically several years for tax/business records). Confirm with their accountant.

## Post-transfer checklist

- [ ] All accounts above show **clinic billing email** as the account owner.
- [ ] Developer is added back to each account at the **minimum role** needed to support.
- [ ] Production site still works (`https://rub-club.vercel.app` and any custom domain).
- [ ] At least one **non-deploy support task** (e.g. add a new staff user, change a marketing block) is tested end-to-end with the new account structure.
- [ ] Old developer-owned account credentials are **rotated and removed** from the password manager.
- [ ] Update [`services-retainer-agreement-template.md`](services-retainer-agreement-template.md) Exhibit A to list the new account owners.

## After transfer: what changes for the developer

- The developer is **no longer the host** of the clinic's data — that role belongs to the clinic.
- The developer's exposure narrows to **the work performed** (development, deploys, on-call support), governed by the services agreement.
- If the developer ever needs to access production data to debug a real issue, do so under the clinic's account using the developer's named user; do not export/copy data to personal machines.
- If/when scope changes to include PHI again, both parties sign the Business Associate Agreement (`docs/business-associate-agreement-template.md`) on top of the existing services agreement.
