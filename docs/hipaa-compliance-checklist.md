# HIPAA compliance posture — scheduling-only website

**Not legal advice.** Review with your attorney/compliance advisor. Keep signed contracts and BAAs **outside git** (secure folder or password manager).

**Developer ↔ clinic services agreement / retainer (template, local-only):**
- Source: [`services-retainer-agreement-template.md`](services-retainer-agreement-template.md)
- BAA template (only if the scope changes to include PHI later): [`business-associate-agreement-template.md`](business-associate-agreement-template.md), generate PDF with `npm run generate:baa-pdf`

## Current scope of this website

This website is intentionally **scheduling, marketing, and customer-list only**. It does **not** collect, store, or transmit clinical PHI through any public form, admin upload, or notification email.

What the site does:

- Public marketing pages.
- Online booking that collects only **name, phone, email, appointment time/service, and optional scheduling notes** — the same info a front desk would write down on the phone.
- Staff admin: appointment management, patient list (name/phone/email/appointment history/payment type), **scheduling-only** notes fields with banners warning against entering clinical information.
- Printable PDFs (chiropractic 9-page packet, massage new-client form) for the patient to complete on paper and bring in person.

What the site explicitly does **not** do (any longer):

- Online intake form with medical history / allergies / medications / pregnancy / pacemaker fields. (Retired — `/api/intake` returns 410 Gone.)
- Insurance card or photo-ID image uploads, either by patients or by staff. (Retired.)
- Clinical / treatment notes. Those belong in the clinic's EMR or paper chart, not in this admin.
- Email/SMS messages that contain clinical PHI.

## Why this matters

Because PHI doesn't flow through the website, the **developer is not acting as a HIPAA Business Associate for clinical data**. The clinic remains a HIPAA covered entity for any PHI it collects in person, in its EMR, or by phone — that part is unchanged.

If the clinic later decides it wants real online intake, insurance uploads, or PHI-bearing messaging on the website, **scope changes** and the developer-clinic services agreement should be amended to include a Business Associate Agreement and the additional vendor/process work below.

## Patient/booking data the website *does* collect (minimization summary)

| Field | Where used | PHI under HIPAA? |
|------|-----------|------------------|
| Name, phone, email | Booking confirmation, staff dashboard, optional appointment reminders | **Minimal-risk identifier** when held by a covered entity; treat as confidential. |
| Appointment time, service line, location | Scheduler | Same as above. |
| Scheduling notes (optional) | Booking + admin (with "no health info" banner) | Should not contain clinical info; banner enforces. |
| Payment type / Square payment link | Billing | Not clinical PHI. |

No diagnoses, treatment details, insurance member IDs, images, or medical history are collected on this site.

## Action items (still recommended)

These remain best practice even with a scheduling-only site:

1. **Form a business entity** (LLC or similar) before charging recurring fees. Separates personal assets.
2. **Cyber liability / tech E&O insurance** sized for your retainer revenue. Carriers: Coalition, At-Bay, Hiscox, Beazley, Travelers.
3. **Signed services agreement / retainer** between you and the clinic — see template.
4. **Operational hygiene:**
   - Lock down admin accounts (Firebase Auth, strong passwords, MFA on Vercel/Google accounts).
   - Remove staff Firebase users promptly when employment ends.
   - Don't put scheduling notes, names, or appointment details into chat tools, personal email, or SMS.
   - Disable analytics/log drains that capture booking submissions.
5. **Texas business records:** scheduling and appointment records may have records-retention implications under state contract / consumer-protection law even when they aren't clinical PHI. Confirm retention period with the clinic and a Texas attorney.
6. **Ownership transition:** if/when the clinic takes over the Vercel + Firebase + domain accounts, follow [`ownership-transfer-runbook.md`](ownership-transfer-runbook.md). After transfer, the developer stops being the data host.

## If scope ever expands to PHI again (re-trigger the full HIPAA stack)

Then you also need:

1. **Vendor BAAs** — Google Cloud (Firebase), Vercel HIPAA add-on, any HIPAA-eligible mail vendor, etc.
2. **Developer ↔ clinic BAA** — sign [`business-associate-agreement-template.md`](business-associate-agreement-template.md) after attorney review.
3. **Written Security Risk Assessment** (HHS template) updated annually.
4. **Privacy / security / breach-notification policies** and workforce training.
5. **Audit logging** of any PHI access (the `phi_access_log` Firestore collection already exists in the codebase for re-use).
6. **PHI-free email notifications**, opaque tokens for any "complete your intake" links, no PHI in URLs or analytics.
7. **Breach response plan** (60-day notification to patients; ≥500 records → HHS notice).

The code that previously implemented an online intake form is still in the repo (`components/IntakeForm.tsx`, `lib/intake-office-notification.ts`, `lib/intake-form-fields.ts`, `lib/privacy.ts`, etc.) — it's just not wired up to any page. It can be re-enabled when the compliance items above are signed and in place.

## References

- [HHS HIPAA for Professionals](https://www.hhs.gov/hipaa/for-professionals/index.html)
- [HHS Security Risk Assessment Tool](https://www.healthit.gov/topic/privacy-security-and-hipaa/security-risk-assessment-tool)
- [HHS cloud computing guidance](https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html)
- [Google Cloud HIPAA BAA](https://cloud.google.com/terms/hipaa-baa)
- [Vercel HIPAA guide](https://vercel.com/guides/hipaa-compliance-guide-vercel)
