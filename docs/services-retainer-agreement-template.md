# Website services & monthly retainer agreement (template)

**Local-only template. Not on the website. Not legal advice.** Have a licensed Texas attorney review and adapt this before either party signs.

This template covers the ongoing relationship between you (the developer/host) and the clinic (the customer) for a **scheduling-only website** — the scope described in [`hipaa-compliance-checklist.md`](./hipaa-compliance-checklist.md).

If the clinic later asks for PHI features (online intake, insurance card uploads, patient portal, etc.), pause and add a Business Associate Agreement and updated scope before doing the work. Use [`business-associate-agreement-template.md`](./business-associate-agreement-template.md).

---

## How to use

1. Fill in every `[BRACKET]` field.
2. Attach **Exhibit A** (services list), **Exhibit B** (fees), and **Exhibit C** (account ownership).
3. Both parties sign. Store signed copy in your secure folder / password manager.
4. Update each anniversary if pricing or scope changes.

---

# WEBSITE SERVICES AND MONTHLY RETAINER AGREEMENT

This Website Services and Monthly Retainer Agreement (this "**Agreement**") is entered into as of **[EFFECTIVE DATE]** (the "**Effective Date**") by and between:

**Client / Customer:**  
**[LEGAL NAME OF CLINIC / PRACTICE]**, a **[STATE OF FORMATION + ENTITY TYPE]**  
Address: **[STREET, CITY, STATE ZIP]**  
("**Client**")

and

**Provider / Developer:**  
**[YOUR LEGAL NAME OR LLC NAME]**, a **[TEXAS] [INDIVIDUAL / LLC / S-CORP]**  
Address: **[STREET, CITY, STATE ZIP]**  
("**Provider**")

(each a "**Party**" and together the "**Parties**").

## 1. Services

Provider will perform the website development, hosting administration, and ongoing support services described in **Exhibit A** (the "**Services**") for Client.

The Services are intended to support **scheduling, marketing, and customer-list functions only**. Unless and until the Parties sign an amendment and a Business Associate Agreement, the Services **do not** include collecting, storing, transmitting, or processing Protected Health Information (as defined under the Health Insurance Portability and Accountability Act of 1996 and its implementing regulations, "**HIPAA**") on behalf of Client.

Provider will use reasonable professional care to deliver the Services in a workmanlike manner consistent with industry standards.

## 2. Term and termination

**2.1 Term.** This Agreement begins on the Effective Date and continues on a **month-to-month** basis until terminated.

**2.2 Termination for convenience.** Either Party may terminate this Agreement for any reason by giving the other Party at least **thirty (30) days'** written notice (email acceptable to the addresses in Section 14).

**2.3 Termination for cause.** Either Party may terminate this Agreement immediately if the other Party materially breaches it and fails to cure the breach within **fifteen (15) days** of written notice describing the breach.

**2.4 Effect of termination.** Upon termination Provider will (a) deliver to Client all source code, deploy keys, and account credentials necessary to operate the website, (b) cooperate in the orderly transfer of accounts and data per the runbook at [`ownership-transfer-runbook.md`](./ownership-transfer-runbook.md), and (c) invoice for any prorated unpaid fees through the effective date of termination. Sections 5–13 survive termination.

## 3. Fees and payment

**3.1 Monthly retainer.** Client will pay Provider the monthly retainer set out in **Exhibit B** in exchange for the Services. The retainer includes a defined block of hours per month; hours not used in a given month do not carry over.

**3.2 Out-of-scope work.** Work outside the retainer scope, including major redesigns and new features, will be quoted separately and billed at the hourly rate in **Exhibit B**.

**3.3 Pass-through costs.** Third-party vendor fees (Vercel, Google Cloud / Firebase, Square, SendGrid, domain registrar, etc.) are paid directly by Client to those vendors. After the account-ownership transfer described in **Exhibit C**, all such accounts are billed to Client.

**3.4 Invoicing.** Provider will invoice Client on or about the first business day of each calendar month. Payment is due **net 15** from the invoice date. Late payments accrue interest at 1.5% per month or the maximum allowed by Texas law, whichever is lower.

**3.5 Suspension for non-payment.** If an invoice is more than 30 days past due, Provider may pause non-emergency work after written notice. Provider will not intentionally take the website offline for non-payment; the goal of a pause is to limit further unpaid work.

## 4. Account ownership

The Parties acknowledge that Client owns all third-party accounts (hosting, database, domain, email, payments, analytics) used to operate the website, as set out in **Exhibit C**. Provider will hold only the access necessary to perform the Services.

## 5. Data and confidentiality

**5.1 Client data.** All customer data, appointment records, marketing copy, images, and other content provided by or generated for Client through the website is Client's confidential information and remains Client's property.

**5.2 Provider obligations.** Provider will (a) access Client data only as needed to perform the Services, (b) not disclose Client data to any third party except as needed to perform the Services or as required by law, (c) protect Client data using commercially reasonable administrative, technical, and physical safeguards, and (d) promptly notify Client of any suspected or confirmed security incident affecting Client data.

**5.3 Scope limitation — no PHI.** Provider does **not** intend to act as a "Business Associate" under HIPAA. Client will not direct PHI through the website, the admin tools, or any communication channel covered by this Agreement (other than minimal scheduling identifiers such as name, phone, email, and appointment time). If Client wishes to add PHI features, the Parties must first amend this Agreement and sign a Business Associate Agreement.

**5.4 Mutual confidentiality.** Each Party will keep the other's non-public business information confidential for the term of this Agreement and for **two (2) years** thereafter, except as required by law.

## 6. Intellectual property

**6.1 Pre-existing materials.** Each Party retains ownership of its pre-existing intellectual property (including Provider's reusable libraries, templates, and tooling).

**6.2 Custom work.** Subject to payment of all fees through delivery, custom code, designs, and copy created specifically for Client under this Agreement are owned by Client.

**6.3 License to Provider.** Client grants Provider a limited, non-exclusive license to use Client's trademarks and content to perform the Services and, with Client's prior written consent, in Provider's portfolio.

## 7. Independent contractor status

Provider is an independent contractor, not an employee, partner, or agent of Client. Provider controls the manner and means of performing the Services and is responsible for its own taxes, insurance, and benefits.

## 8. Warranties and disclaimers

Provider warrants that the Services will be performed in a professional and workmanlike manner. **EXCEPT AS EXPRESSLY STATED IN THIS AGREEMENT, THE SERVICES AND ANY DELIVERABLES ARE PROVIDED "AS IS" AND PROVIDER DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.**

Provider does not warrant that the website will be uninterrupted or error-free. Provider has no responsibility for third-party vendor outages.

## 9. Limitation of liability

**EXCEPT FOR (A) GROSS NEGLIGENCE OR WILLFUL MISCONDUCT, (B) BREACH OF SECTION 5 (DATA AND CONFIDENTIALITY), OR (C) INDEMNIFICATION OBLIGATIONS, NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.**

**EACH PARTY'S AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT, REGARDLESS OF THE FORM OF ACTION, WILL NOT EXCEED THE FEES PAID OR PAYABLE BY CLIENT TO PROVIDER UNDER THIS AGREEMENT DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.**

## 10. Indemnification

**10.1 Provider.** Provider will defend and indemnify Client against third-party claims to the extent caused by Provider's (a) breach of this Agreement, (b) gross negligence or willful misconduct, or (c) infringement by Provider's deliverables of any third party's intellectual property rights.

**10.2 Client.** Client will defend and indemnify Provider against third-party claims to the extent caused by (a) Client's content or trademarks, (b) Client's breach of Section 5.3 (no PHI without amendment), or (c) Client's acts or omissions in operating its clinic and HIPAA program (including any breach of PHI that did not originate on the website).

## 11. Insurance

Provider will maintain commercial general liability and technology errors & omissions ("**E&O**") insurance with limits of at least **$1,000,000** per claim and **$1,000,000** aggregate, and will name Client as a certificate holder on request. If the scope ever broadens to include PHI under HIPAA, Provider will additionally carry cyber liability insurance with limits to be agreed in the BAA amendment.

Client will maintain commercial general liability and professional liability insurance appropriate to its medical practice.

## 12. Governing law and dispute resolution

This Agreement is governed by the laws of the **State of Texas**, without regard to its conflict-of-laws rules. Any dispute will be brought in the state or federal courts located in **[COUNTY NAME] County, Texas**, and the Parties consent to the exclusive jurisdiction of those courts.

The Parties will first attempt in good faith to resolve any dispute through informal discussion before initiating litigation.

## 13. Miscellaneous

**13.1 Entire agreement.** This Agreement, together with its Exhibits, is the entire agreement between the Parties regarding its subject matter and supersedes prior or contemporaneous oral or written agreements.

**13.2 Amendment.** Amendments must be in writing and signed by both Parties.

**13.3 Assignment.** Neither Party may assign this Agreement without the other Party's written consent, except to a successor in interest by merger, acquisition, or sale of substantially all assets.

**13.4 Force majeure.** Neither Party is liable for delays caused by events beyond its reasonable control.

**13.5 Severability.** If any provision is held unenforceable, the remainder of the Agreement remains in effect.

**13.6 Counterparts; electronic signatures.** This Agreement may be signed in counterparts and by electronic signature.

## 14. Notices

Notices must be in writing and sent to the addresses below. Email is sufficient for routine communications; formal legal notices must be sent by email **and** by overnight courier or certified mail.

**Client:**  
**[CONTACT NAME]**, **[CLINIC NAME]**  
**[ADDRESS]**  
Email: **[CLINIC OWNER BUSINESS EMAIL]**

**Provider:**  
**[YOUR NAME]**, **[YOUR LLC OR INDIVIDUAL]**  
**[ADDRESS]**  
Email: **[YOUR BUSINESS EMAIL]**

---

## Signatures

**CLIENT — [CLINIC NAME]**

Signature: ______________________________  
Name: **[PRINTED NAME]**  
Title: **[TITLE — e.g. Owner / President]**  
Date: ____________________

**PROVIDER — [YOUR LLC / NAME]**

Signature: ______________________________  
Name: **[PRINTED NAME]**  
Title: **[TITLE — e.g. Member / Owner]**  
Date: ____________________

---

## Exhibit A — Description of Services

> Fill this in honestly. If something isn't here, it isn't included in the retainer.
>
> **Optional:** For a one-time phased rollout (consolidate three legacy sites, then HIPAA + scheduler + PHI features), attach or reference the signed [`two-phase-client-sow.md`](./two-phase-client-sow.md) dated **[SOW DATE]**.

### Included in monthly retainer (up to [N] hours per month)

- Routine content updates to the marketing pages (hours of operation, staff bios, services, FAQs).
- Routine bug fixes and security patches on the existing scheduling site.
- Monitoring of production health (Vercel, Firebase) and triage of incidents during business hours.
- Up to **one (1)** routine deploy of small changes per week.
- Email / phone / text support during business hours, response within **one (1) business day**.
- Quarterly review of dependencies and recommended upgrades.
- Coordination with Client's billing and operations team for booking workflows.

### Not included (out of scope; quoted separately)

- New product features beyond bug fixes and copy edits.
- Custom integrations with new third-party vendors (EMR, billing software, accounting tools).
- Any work that adds PHI to the website (online intake, insurance card upload, patient portal). Requires a signed Business Associate Agreement first.
- Migration of historical data from other systems.
- 24×7 on-call coverage. After-hours response is best-effort.
- Marketing services (SEO campaigns, paid ads, social media management, copywriting).
- Training new staff on the admin tools beyond one initial onboarding session.

### Service levels (best effort)

- Acknowledge incoming requests within **one (1) business day**.
- Critical incidents (site down, booking broken) addressed best-effort outside business hours; root-cause resolution within **two (2) business days**.

---

## Exhibit B — Fees

| Item | Amount |
|------|--------|
| Monthly retainer | **$[AMOUNT] / month** for up to **[N] hours** of work per month |
| Hourly rate for out-of-scope work | **$[AMOUNT] / hour**, in 15-minute increments |
| Vendor pass-through fees | Paid directly by Client to vendor (see Exhibit C) |
| Rush surcharge (work outside business hours by Client request) | +**[X]%** |

Payment method: **[ACH / Square invoice / etc.]**. Invoicing date: 1st of each month, net 15.

---

## Exhibit C — Account ownership

After the transfer described in [`ownership-transfer-runbook.md`](./ownership-transfer-runbook.md), each of the following accounts is owned by Client and supported by Provider:

| Vendor | Owner | Developer access |
|--------|-------|------------------|
| GitHub (source code) | Client org | Maintainer on repo |
| Vercel (hosting) | Client team | Member |
| Google Cloud / Firebase | Client project | Editor (downgrade from Owner after transfer) |
| Domain registrar | Client account | Support contact |
| SendGrid / email | Client account | API access for support |
| Square (payments) | Client account | API access for support |
| Twilio (SMS, if used) | Client account | API access for support |
| Analytics (Vercel/Sentry/etc.) | Client account | Member |

Credentials are stored in a shared password manager owned by Client; Provider holds delegated access only.

---

*Template last revised: [DATE — update when this template changes]. Not legal advice.*
