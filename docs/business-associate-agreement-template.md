# Business Associate Agreement (template)

**PDF (local only, not on the website):** run `npm run generate:baa-pdf` → `docs/business-associate-agreement-template.pdf`

**IMPORTANT:** This is a **starting-point template** for a small practice and an independent developer/host. It is **not legal advice**. Have a licensed attorney in **Texas** review and adapt it before anyone signs. HIPAA rules are in **45 CFR Part 164** (especially **§164.502(e)** and **§164.504(e)**).

## When you need this BAA

This BAA is **only required if the website / admin actually handles PHI** for the clinic — for example, online intake with medical questions or insurance card uploads, PHI in email/SMS, or a patient portal exchanging clinical info.

As of the current scope, the website is **scheduling, marketing, and customer-list only** (see [`hipaa-compliance-checklist.md`](hipaa-compliance-checklist.md)). In that scope the developer is generally **not** a Business Associate, and the parties' relationship is governed by a services agreement / retainer instead — see [`services-retainer-agreement-template.md`](services-retainer-agreement-template.md). Confirm with counsel.

Sign this BAA **before** the clinic asks the developer to build/operate any of the PHI-bearing features listed in the "If scope ever expands" section of the HIPAA checklist.

---

## How to use

1. Fill in every `[BRACKET]` field.
2. Attach **Exhibit A** (description of services/systems) and **Exhibit B** (subcontractors).
3. Both parties sign two originals (or use a signed PDF service).
4. Store signed copies **outside** git (secure folder). Do not commit signed copies to this repository.
5. The **clinic** still needs its own HIPAA program (NPP, risk assessment, training) — this agreement does not replace that.

---

# BUSINESS ASSOCIATE AGREEMENT

This Business Associate Agreement (“**Agreement**”) is entered into as of **[EFFECTIVE DATE]** (“**Effective Date**”) by and between:

**Covered Entity:**  
**[LEGAL NAME OF CLINIC / PRACTICE]**  
Address: **[STREET, CITY, STATE ZIP]**  
(“**Covered Entity**”)

and

**Business Associate:**  
**[YOUR LEGAL NAME OR LLC]**  
Address: **[STREET, CITY, STATE ZIP]**  
Email: **[EMAIL]**  
(“**Business Associate**”)

Covered Entity and Business Associate are each a “**Party**” and together the “**Parties**.”

---

## 1. Background

1.1 Covered Entity is a healthcare provider that may create, receive, maintain, or transmit **Protected Health Information** (“**PHI**”) as defined in **45 CFR §160.103**.

1.2 Business Associate provides **[website / software development / hosting / administration]** services for Covered Entity’s patient-facing website and related systems (the “**Services**”), as described in **Exhibit A**.

1.3 In performing the Services, Business Associate may create, receive, maintain, or transmit PHI on behalf of Covered Entity. The Parties agree to comply with the Health Insurance Portability and Accountability Act of 1996 and its implementing regulations (“**HIPAA**”), including the Privacy, Security, and Breach Notification Rules.

---

## 2. Definitions

Capitalized terms not defined in this Agreement have the meanings in HIPAA. “**Breach**,” “**Security Incident**,” and “**Unsecured PHI**” have the meanings in **45 CFR §164.402** and related guidance.

---

## 3. Permitted uses and disclosures of PHI

3.1 Business Associate may use and disclose PHI **only** to:

(a) perform the Services for Covered Entity;  
(b) perform data aggregation services relating to the health care operations of Covered Entity, if applicable; and  
(c) as **Required by Law**.

3.2 Business Associate may not use or disclose PHI in a manner that would violate the Privacy Rule if done by Covered Entity, except as permitted in **§164.504(e)** or this Agreement.

3.3 Business Associate may use PHI for the **proper management and administration** of Business Associate or to carry out **legal responsibilities**, only if disclosures are **Required by Law** or Business Associate obtains **reasonable assurances** from the recipient that the PHI will be held confidential and used only for the stated purpose.

---

## 4. Safeguards

4.1 Business Associate will implement **administrative, physical, and technical safeguards** that reasonably and appropriately protect the confidentiality, integrity, and availability of electronic PHI that Business Associate creates, receives, maintains, or transmits on behalf of Covered Entity, consistent with the HIPAA Security Rule.

4.2 Without limiting the foregoing, Business Associate will use commercially reasonable efforts to:

(a) restrict access to PHI to personnel who need it for the Services;  
(b) use encryption in transit (e.g., HTTPS) for PHI submitted through the Services;  
(c) avoid storing PHI in systems that are not covered by a HIPAA business associate or equivalent agreement with Business Associate, as listed in **Exhibit B**;  
(d) avoid transmitting PHI in **email or SMS** unless using a HIPAA-eligible provider under a BAA; and  
(e) maintain access logging where technically implemented for staff review of intake records.

4.3 Covered Entity is responsible for **workforce training**, **workstation use in the clinic**, **paper records**, **billing systems**, and **in-office** handling of insurance cards and forms not hosted by Business Associate.

---

## 5. Reporting and mitigation

5.1 **Security incidents.** Business Associate will report to Covered Entity any **Security Incident** of which Business Associate becomes aware, without unreasonable delay and in no event later than **[5 / 10] business days** after discovery, unless the incident is a successful attack on Business Associate’s systems that did not compromise PHI (e.g., blocked port scan), as determined by Business Associate in good faith.

5.2 **Breaches.** Business Associate will notify Covered Entity of any **Breach of Unsecured PHI** without unreasonable delay and in no event later than **[5 / 10] calendar days** after discovery. The notice will include, to the extent known: (a) description of what happened; (b) types of PHI involved; (c) steps Business Associate has taken; and (d) contact information for follow-up.

5.3 Covered Entity is responsible for **patient and regulatory notification** under HIPAA and state law. Business Associate will cooperate with reasonable requests for information needed for that process.

5.4 Business Associate will take reasonable steps to **mitigate** harmful effects of any use or disclosure of PHI that violates this Agreement.

---

## 6. Subcontractors

6.1 Business Associate may engage **subcontractors** that create, receive, maintain, or transmit PHI on Business Associate’s behalf only if Business Associate enters into a **written agreement** with each subcontractor containing terms substantially similar to this Agreement, as required by **45 CFR §164.504(e)(2)(i)** and **§164.502(e)(1)(ii)**.

6.2 Current subprocessors are listed in **Exhibit B**. Business Associate will provide **[15 / 30] days’** prior written notice of material new subprocessors that handle PHI, so Covered Entity may object on reasonable HIPAA-related grounds.

---

## 7. Access, amendment, and accounting

7.1 Upon Covered Entity’s written request, Business Associate will make available PHI in Business Associate’s possession for **individual access, amendment, and accounting of disclosures**, as required for Covered Entity to meet its obligations under **45 CFR §164.524, §164.526, and §164.528**, within **[30] days** or such other period as HIPAA requires.

7.2 If an individual submits a request directly to Business Associate, Business Associate will forward it to Covered Entity within **[5] business days**.

---

## 8. Audit and HHS access

8.1 Business Associate will make its internal practices, books, and records relating to the use and disclosure of PHI available to the **U.S. Department of Health and Human Services** for purposes of determining Covered Entity’s and Business Associate’s compliance with HIPAA, as required by **45 CFR §164.504(e)(2)(ii)**.

8.2 Covered Entity may request reasonable documentation of safeguards (e.g., summary of hosting configuration) no more than **once per calendar year**, on **[15] days’** notice, subject to confidentiality of security details.

---

## 9. Term and termination

9.1 This Agreement begins on the Effective Date and continues until terminated as below.

9.2 Either Party may terminate for **material breach** if the other Party does not cure within **[30] days** of written notice (or immediately if cure is not possible).

9.3 Covered Entity may terminate if Business Associate violates a material term and cure is not possible.

9.4 Upon termination, Business Associate will, at Covered Entity’s choice, **return or destroy** PHI in Business Associate’s possession, except copies required by law or securely retained backups that are destroyed on schedule **[e.g., within 60 days]**. Business Associate will certify destruction in writing if requested.

---

## 10. Covered Entity obligations

10.1 Covered Entity will not request Business Associate to use or disclose PHI in violation of HIPAA.

10.2 Covered Entity will provide **Notice of Privacy Practices** and obtain any **authorizations** required for uses and disclosures outside treatment, payment, and health care operations.

10.3 Covered Entity will maintain its own **risk analysis**, **policies**, and **breach response plan**.

---

## 11. Limitation of liability; independent contractor

11.1 **[OPTIONAL — HAVE LAWYER DRAFT]** The Parties’ liability under this Agreement is subject to limitations and exclusions as set forth in **[SEPARATE SERVICES AGREEMENT / STATEMENT OF WORK]**, except that nothing limits either Party’s obligations under HIPAA or for breaches caused by willful misconduct.

11.2 Business Associate is an **independent contractor**, not an employee or agent of Covered Entity, except for purposes of HIPAA as Business Associate.

---

## 12. General

12.1 **Governing law:** State of **Texas**, without regard to conflict-of-law rules.

12.2 **Entire agreement:** This Agreement, Exhibits, and any signed Statement of Work supersede prior discussions on HIPAA between the Parties.

12.3 **Amendment:** Must be in writing signed by both Parties.

12.4 **Survival:** Sections 5, 8, 9, and 10 survive termination.

12.5 **Counterparts:** Signatures may be electronic.

---

## Signatures

**COVERED ENTITY:** [LEGAL NAME OF CLINIC / PRACTICE]

By: _________________________________  
Name: **[OWNER NAME]**  
Title: **[e.g., Owner / President]**  
Date: _______________

**BUSINESS ASSOCIATE:** [YOUR LEGAL NAME OR LLC]

By: _________________________________  
Name: **[YOUR NAME]**  
Title: **[e.g., Member / Sole proprietor]**  
Date: _______________

---

# EXHIBIT A — Services and systems

**Services:** Design, development, deployment, and maintenance of the patient website and staff admin tools, including:

- Public website (e.g., booking, contact, patient forms)
- Online intake form submission (if enabled)
- Staff administrative interface for reviewing intake submissions
- Related hosting and database administration

**Systems (as of Effective Date):**

| System | Purpose | Account owner |
|--------|---------|----------------|
| Firebase / Google Cloud (Firestore, Storage, Auth) | Store intake data and uploads | **[Clinic / Business Associate]** |
| Vercel | Host website and API routes | **[Clinic / Business Associate]** |
| SendGrid | Transactional email (non-PHI alerts only, per configuration) | **[Clinic / Business Associate]** |
| Square | Payments / booking prepay (if enabled) | **[Clinic]** |

**PHI minimization (recommended):** Until Covered Entity completes vendor BAAs and clinic HIPAA policies, online intake may be limited to **printable PDFs** and **in-office** collection of insurance cards; full electronic intake may be enabled only by mutual written agreement.

---

# EXHIBIT B — Subcontractors (subprocessors)

Business Associate uses the following subcontractors that may process PHI when the Services store or transmit PHI:

| Subcontractor | Service | BAA / compliance mechanism |
|---------------|---------|----------------------------|
| Google LLC (Google Cloud / Firebase) | Database, file storage, authentication | Google Cloud HIPAA BAA accepted by **[account owner]** |
| Vercel Inc. | Application hosting | Vercel HIPAA BAA (Pro + HIPAA add-on) accepted by **[account owner]** |
| Twilio SendGrid | Email delivery | **Not used for PHI** — operational emails only without clinical content |

Covered Entity acknowledges that Business Associate will not transmit PHI through SendGrid except as expressly agreed in writing with PHI removed or de-identified.

**Additional subprocessors:** _______________________

---

# Checklist before signing

- [ ] Legal names and addresses are correct (match insurance contracts / state filings).
- [ ] Exhibit A reflects **who owns** Firebase and Vercel today and the plan to transfer (if any).
- [ ] Clinic has or will obtain **NPP** and **risk assessment**.
- [ ] Google and Vercel HIPAA BAAs accepted on the **same account** that holds production PHI.
- [ ] Attorney review completed: _______________________ Date: __________

---

*Template version: 2026-05-18 — for Rub Club / Chiropractic Associates website project.*
