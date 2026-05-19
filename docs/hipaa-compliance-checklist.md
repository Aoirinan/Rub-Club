# HIPAA compliance checklist (Rub Club website + intake)

**Not legal advice.** Your practice bills insurance in office — you are very likely a **HIPAA covered entity**. Use this checklist with your attorney/compliance advisor. Store signed BAAs and policies **outside git** (secure folder or password manager).

**Developer ↔ clinic BAA template (PDF):** run `npm run generate:baa-pdf` → `docs/business-associate-agreement-template.pdf` (not published on the site; source markdown: [`business-associate-agreement-template.md`](business-associate-agreement-template.md)).

## Status: what the website code already does

- Online intake with insurance/ID uploads → Firebase Firestore + Cloud Storage (private; no public client access)
- Staff-only admin with role checks and `phi_access_log` on intake views/downloads
- Intake office email alerts contain **no patient names or clinical text** (review in admin only)
- `/privacy` page + intake consent checkbox before submit

## Your action items (cannot be done in code alone)

### 1. Google Cloud / Firebase (required for PHI in database)

1. Open [Google Cloud Console](https://console.cloud.google.com/) for your Firebase project.
2. **Compliance** → accept the [HIPAA Business Associate Agreement](https://cloud.google.com/terms/hipaa-baa).
3. Confirm you only use [HIPAA-eligible services](https://cloud.google.com/security/compliance/hipaa) for PHI (Firestore, Cloud Storage, Firebase Auth for staff are typical).
4. Save a PDF/screenshot of BAA acceptance date in your compliance folder.

### 2. Vercel (required — API routes process intake uploads)

1. Upgrade to **Pro** (if not already).
2. Enable the **HIPAA add-on** and accept the BAA: [Vercel HIPAA guide](https://vercel.com/guides/hipaa-compliance-guide-vercel) · [BAA terms](https://vercel.com/legal/baa).
3. Production only for real PHI; do not submit real patient data on Preview deployments.
4. Disable non-essential Vercel integrations/analytics on the production project.
5. Do not log request bodies on `/api/intake`.

### 3. SendGrid (important limitation)

- **SendGrid is not HIPAA-eligible** — do not put PHI in any email body or subject.
- Current intake alerts are generic (“new submission — open admin”). **Keep it that way.**
- Booking/patient confirmation emails may still contain names/appointments; discuss with counsel whether to genericize those too or use a HIPAA-eligible mail vendor later.

### 4. Notice of Privacy Practices (NPP)

1. Confirm which pages in `public/chiropractic-new-patient-packet.pdf` are the official NPP (and whether the massage PDF includes one).
2. `/privacy` links to that packet by default; online intake acknowledges the Notice via `/privacy`.
3. Optional: set `NEXT_PUBLIC_NPP_PDF_URL` only if you later host an **NPP-only** PDF (attorney-approved).

### 5. Policies & training (organizational)

- [ ] Designate privacy/security contact (name + phone/email)
- [ ] Written **security risk assessment** (update annually)
- [ ] Privacy, security, and **breach notification** policies
- [ ] Workforce training: use admin for intake; no forwarding cards to personal email/text
- [ ] Offboard staff Firebase accounts promptly (`staff/<uid>`)
- [ ] Retention rule: how long to keep `intake_forms` and images; delete when no longer needed

### 6. Breach response (prepare before an incident)

- Document who calls counsel, who notifies patients (within **60 days** if PHI breached), when to report to HHS
- Preserve `phi_access_log` and Firebase audit logs during investigation

## Annual / quarterly maintenance

- Review manager/admin access list
- Spot-check `phi_access_log` for unexpected access
- Reconfirm BAAs still active after vendor/plan changes
- Retest intake form after major deploys

## References

- [HHS HIPAA for Professionals](https://www.hhs.gov/hipaa/for-professionals/index.html)
- [HHS cloud computing guidance](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html)
