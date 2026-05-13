import type { FaqEntry } from "@/lib/faqs";

/** Server component: native <details> accordion, SEO-friendly, no client JS. */
export function FaqList({ entries }: { entries: readonly FaqEntry[] }) {
  return (
    <div className="divide-y divide-stone-200">
      {entries.map((e) => (
        <details key={e.q} className="group py-4">
          <summary className="focus-ring flex cursor-pointer items-center justify-between gap-3 text-base font-bold text-[#173f3b]">
            <span>{e.q}</span>
            <span
              aria-hidden
              className="text-xl font-black text-[#0f5f5c] transition group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">{e.a}</p>
        </details>
      ))}
    </div>
  );
}
