export type FaqEntry = { q: string; a: string };

export const FAQS: readonly FaqEntry[] = [
  {
    q: "Do I need a referral to be seen?",
    a: "No referral is required for chiropractic or massage appointments. If you have a referral from another provider, please bring it to your first visit so we can coordinate care.",
  },
  {
    q: "Do you accept insurance?",
    a: "We accept many major medical plans for chiropractic care and file claims on your behalf. Massage therapy is generally self-pay. Call the office before your first visit so we can verify your benefits.",
  },
  {
    q: "How early should I arrive?",
    a: "Please arrive 10–15 minutes before your first appointment so we can complete intake paperwork. Returning patients can arrive about five minutes early.",
  },
  {
    q: "What should I bring to my first appointment?",
    a: "Photo ID, your insurance card (for chiropractic), and a list of current medications or recent imaging if relevant. New massage clients should download the patient form ahead of time.",
  },
  {
    q: "How do I cancel or reschedule?",
    a: "Call the Paris office at 903-785-5551 (chiropractic) or 903-739-9959 (The Rub Club massage), or Sulphur Springs at 903-919-5020. We appreciate at least 24 hours' notice so we can offer the time to another patient.",
  },
  {
    q: "Are children welcome?",
    a: "Yes — we see patients of every age. Both Dr. Collins and Dr. Welborn have experience with pediatric care, and prenatal massage is available at The Rub Club.",
  },
  {
    q: "Do you offer same-day appointments?",
    a: "Often, yes. Use the online booking page to see live openings, or call the office and we will do our best to fit you in.",
  },
  {
    q: "Is parking available?",
    a: "Free parking is available at both locations. The Paris office sits on NE Loop 286 with on-site parking; Sulphur Springs has street parking on Jefferson St. E and a public lot nearby.",
  },
];

export const HOME_FAQS: readonly FaqEntry[] = FAQS.slice(0, 5);
