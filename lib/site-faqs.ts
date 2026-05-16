import { getFirestore } from "@/lib/firebase-admin";
import { FAQS, type FaqEntry } from "@/lib/faqs";

export type SiteFaqDoc = {
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
};

export const SITE_FAQS_COLLECTION = "site_faqs";

export async function getActiveFaqs(): Promise<FaqEntry[]> {
  try {
    const snap = await getFirestore().collection(SITE_FAQS_COLLECTION).get();
    if (snap.empty) return [...FAQS];
    const rows = snap.docs
      .map((d) => {
        const data = d.data();
        const q = typeof data.question === "string" ? data.question : "";
        const a = typeof data.answer === "string" ? data.answer : "";
        const order = typeof data.order === "number" ? data.order : 0;
        const active = data.active !== false;
        if (!active || !q.trim() || !a.trim()) return null;
        return { q, a, order };
      })
      .filter((r): r is { q: string; a: string; order: number } => r !== null)
      .sort((a, b) => a.order - b.order);
    if (rows.length === 0) return [...FAQS];
    return rows.map(({ q, a }) => ({ q, a }));
  } catch {
    return [...FAQS];
  }
}

export function faqSeedDefaults(): Array<SiteFaqDoc & { id: string }> {
  return FAQS.map((f, i) => ({
    id: `faq_${i}`,
    question: f.q,
    answer: f.a,
    category: "general",
    order: i,
    active: true,
  }));
}
