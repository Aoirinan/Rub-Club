import Link from "next/link";
import { LEGAL_PAGES } from "@/lib/legal";

export function LegalRelatedLinks({ currentPath }: { currentPath: string }) {
  const others = LEGAL_PAGES.filter((p) => p.path !== currentPath);
  return (
    <section className="rounded border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
      <p className="font-bold text-[#173f3b]">Related policies</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {others.map((p) => (
          <li key={p.path}>
            <Link className="font-bold text-[#0f5f5c] underline" href={p.path}>
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-600">
        These pages summarize common practices and are not a substitute for advice from your
        attorney. Protected health information is governed by our{" "}
        <Link className="underline" href="/privacy">
          Notice of Privacy Practices
        </Link>
        .
      </p>
    </section>
  );
}
