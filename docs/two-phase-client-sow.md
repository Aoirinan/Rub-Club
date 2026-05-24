# Two-Phase Website Statement of Work

Local-only template. Not legal advice. Have a licensed Texas attorney review and adapt this before either party signs. Store the signed copy outside this repository (secure folder or password manager).

To produce a print-and-sign PDF: `npm run generate:sow-pdf` writes two-phase-client-sow.pdf in this folder. The PDF is the version meant to be signed by hand; this markdown file is the editable source.

---

# Statement of Work

## Effective date

Effective date: ________________________________

## Client

Clinic or practice (legal name): ________________________________

Address: ________________________________

________________________________

Authorized contact (name and title): ________________________________

Email: ________________________________

Phone: ________________________________

## Provider

Name or LLC: ________________________________

Address: ________________________________

________________________________

Authorized contact (name and title): ________________________________

Email: ________________________________

Phone: ________________________________

## Master agreement

If a Website Services Retainer is already in place between the parties, this SOW supplements it. Otherwise leave blank.

Retainer effective date: ________________________________

---

## Overview

This SOW covers a phased rollout of the clinic website in three steps.

Phase 1 — One website (marketing). Replace the three legacy public sites (massage, Paris chiropractic, Sulphur chiropractic) with one primary site at wellnessparistx.com. Clinic staff can edit hours, staff, services, FAQs, banners, and review links in the admin panel without paying separate vendors for separate sites. No PHI. Online booking stays off.

Phase 2A — HIPAA readiness. Signed Business Associate Agreement between Client and Provider, vendor BAAs (Google Cloud, Vercel, email, SMS as applicable), clinic policies, workforce HIPAA training, written security risk assessment, breach response plan. No PHI development begins in production until 2A items marked (required for PHI) are checked and the BAA is executed.

Phase 2B — Scheduler and PHI features. Turn on the public booking flow; rebuild patient insurance card uploads, online intake (medical history), and audit logging. Provider acts as Business Associate for clinical data.

Gating rule. Provider will not begin Phase 2B development or production enablement of any feature that collects, stores, or transmits Protected Health Information until Phase 2A items marked (required for PHI) are checked and the BAA is executed.

---

## Fees and timeline

Fill these by hand. Circle one option where two are presented. Leave blank if not applicable.

Phase 1 fee: $ ____________________  or  included in retainer  (circle one)

Phase 1 target completion date: ________________________________

Phase 2A fee: $ ____________________  or  hourly at $ __________ per hour  (circle one)

Phase 2A target completion date: ________________________________

Phase 2B.1 scheduler enablement fee: $ ____________________

Phase 2B.2 PHI rebuild fee (separate quote on signing of 2A): $ ____________________

Phase 2B target completion date: ________________________________

Ongoing monthly retainer after go-live: $ ____________________ per month

Hours included per month: __________

Payment terms (circle one): Net 15  /  Net 30  /  Other: __________________________

Deposit at signing: $ ____________________

Pass-through vendor costs (hosting, payments, email, SMS, domains) are billed by the vendor directly to Client.

---

## Phase 1 — One website (marketing)

Goal: Replace the three legacy websites with one primary site that clinic staff can edit. No PHI. Online booking remains off.

### Phase 1 deliverables

Phase 1 — DNS and production

☐ Primary domain wellnessparistx.com (and www) live on Vercel production
☐ Legacy domains massageparistexas.com and chiropracticsulphursprings.com point to the same Vercel project; legacy homepages redirect to the correct section of the new site
☐ Registrar or Vercel redirect for chiropracticparistexas.com → primary domain
☐ NEXT_PUBLIC_APP_URL set to the canonical domain; site redeployed
☐ Firebase Auth authorized domains include primary, legacy, and preview hostnames
☐ SSL "Ready" for all domains in Vercel

Phase 1 — Content and quality assurance

☐ Staff parity check complete: names, titles, photos, and roles match the legacy sites
☐ Paris and Sulphur Springs office hours correct in admin
☐ Smoke test of public pages on production hostname (home, services, locations, reviews, contact)

Phase 1 — Clinic admin access and training

☐ Clinic managers promoted in admin. Number of managers: __________
☐ Superadmin access documented to: ________________________________
☐ Provider delivers an admin-panel walkthrough
☐ "Online booking enabled" is unchecked in admin
☐ Site header reads "Contact us" (not "Book Now")

Phase 1 — Marketing and listings (Client task with Provider guidance)

☐ Google Business Profile website URLs updated to the primary domain
☐ Print materials, email signatures, and ad landing URLs updated as practical

### Phase 1 — out of scope

Public booking wizard, payment processing, SMS appointment reminders, online intake, insurance card uploads, BAA execution. These belong to later phases.

### Phase 1 — known limitations

Adding a brand-new doctor or staff slot beyond what already exists in the admin may require a code deploy by Provider. The three legacy "specials" popups remain editable per brand until Client requests unification.

### Phase 1 acceptance

Client confirms the items above are complete and Phase 1 is accepted.

Client signature: ________________________________  Date: ____________________

Print name: ________________________________

Provider signature: ________________________________  Date: ____________________

Print name: ________________________________

---

## Phase 2A — HIPAA readiness

Goal: Put signed BAAs, vendor agreements, clinic policies, and safeguards in place before any PHI flows through the website. Items marked (required for PHI) must be checked before Phase 2B PHI feature work begins in production.

### Phase 2A.A — Legal and agreements

☐ (required for PHI) Amend the Website Services agreement to include PHI scope
☐ (required for PHI) Sign developer-to-clinic Business Associate Agreement (attorney-reviewed); store outside git
☐ (required for PHI) Client completes a written Security Risk Assessment (HHS SRA Tool); schedule annual update
☐ (required for PHI) Client adopts privacy, security, and breach-notification policies; document workforce HIPAA training
☐ (required for PHI) Client documents a breach response plan: patient notice within 60 days; HHS notice if 500 or more individuals affected
☐ Provider has formed a business entity (LLC or similar) and carries cyber or technology E&O insurance appropriate to scope

### Phase 2A.B — Vendor BAAs and HIPAA-eligible services

☐ (required for PHI) Google Cloud HIPAA BAA accepted on the account that owns the production Firebase project
☐ (required for PHI) Vercel HIPAA enabled (Pro plan + HIPAA add-on) on the account that hosts production
☐ (required for PHI) Email vendor BAA signed if notifications may include PHI (today's email setup is scheduling-only)
☐ (required for PHI) SMS vendor BAA signed if SMS may include PHI (today's SMS setup is scheduling-only)
☐ Payments vendor (Square): document whether payment data ties to PHI; obtain BAA or document scope limitation

### Phase 2A.C — Technical and operational safeguards

☐ Multi-factor authentication enabled on production Google, Vercel, and Firebase admin accounts
☐ Firestore and Storage remain server-only (no client-side PHI reads)
☐ Analytics and log drains reviewed; none capture form payloads
☐ Legacy cleanup: any historical insurance-upload artifacts purged from production database and storage before re-launch
☐ Scheduling data retention period confirmed with Client accountant and Texas counsel before automated purge is enabled
☐ Firestore export backups configured before any irreversible retention deletes

### Phase 2A acceptance

All items above marked (required for PHI) are complete. Client gives written approval for Provider to begin Phase 2B engineering.

Client signature: ________________________________  Date: ____________________

Print name: ________________________________

Provider signature: ________________________________  Date: ____________________

Print name: ________________________________

---

## Phase 2B — Scheduler and PHI features

Prerequisite: Phase 2A acceptance above is signed. Without that signature, Provider will not begin Phase 2B work that touches PHI in production.

### Phase 2B.1 — Scheduler and payments (no PHI)

Most scheduler code already exists. This subsection is enablement and operations.

☐ Providers and schedules configured in admin
☐ "Online booking enabled" checked in admin
☐ Production environment variables set (CRON_SECRET, SendGrid, optional Square, optional Twilio)
☐ Firebase Auth authorized domains include all live hostnames
☐ Smoke test passes: public booking, staff scheduler, patient reschedule and cancel links
☐ Optional: enable the scheduling data retention cron after counsel sign-off

### Phase 2B.2 — PHI features (rebuild — billable development)

Prior online intake and insurance image upload code was previously removed from this codebase for compliance reasons. Phase 2B.2 is new implementation.

☐ (required for PHI) Patient insurance card upload (front and back) with secure storage and server-side APIs
☐ (required for PHI) Staff admin UI to review uploads
☐ (required for PHI) Online intake form (medical history, allergies, medications, etc.) and a secure submission endpoint
☐ (required for PHI) Audit log entry on every staff view or download of PHI
☐ (required for PHI) Email and SMS templates verified PHI-free; opaque tokens for "complete your intake" links; no PHI in URLs or analytics
☐ Patient forms page copy updated to match the final PDF-only vs. online-intake decision
☐ Production environment documented for data retention tooling

### Phase 2B acceptance

End-to-end test passes. Test notifications contain no clinical PHI in subject or body. Clinic owner approves production go-live.

Client signature: ________________________________  Date: ____________________

Print name: ________________________________

Provider signature: ________________________________  Date: ____________________

Print name: ________________________________

---

## Appendix A — Legacy domain forwarding

massageparistexas.com — homepage redirects to the massage section of the new site
chiropracticsulphursprings.com — homepage redirects to the Sulphur Springs section
chiropracticparistexas.com — registrar or Vercel redirect to the primary domain
wellnessparistx.com — primary brand (canonical)

Deep links on legacy hosts are not mapped path-by-path. Bookmarks to old inner pages may require manual redirects if traffic warrants.

---

## Master signatures

By signing below, both parties agree to the scope, fees, and gating rule described in this SOW. This SOW supplements the Website Services Retainer if one is referenced above.

CLIENT

Signature: ________________________________

Print name: ________________________________

Title: ________________________________

Date: ____________________

PROVIDER

Signature: ________________________________

Print name: ________________________________

Title: ________________________________

Date: ____________________

---

Internal repository references, for Provider use and not part of the executed contract: hipaa-compliance-checklist.md, services-retainer-agreement-template.md, business-associate-agreement-template.md, dns-prep-checklist.md, staff-parity-checklist.md, client-handout-one-website-one-domain.md.

Template last revised: May 2026. Not legal advice.
