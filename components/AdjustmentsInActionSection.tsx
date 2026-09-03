import Image from "next/image";
import { getContentMany } from "@/lib/cms";
import { DOCTOR_CMS_KEYS, getDoctorsForMarketing } from "@/lib/cms-doctors";
import { getSiteOwnerConfig, type DoctorMediaItem } from "@/lib/site-owner-config";
import { getUiText } from "@/lib/ui-text";

/** "Greg Thompson" → "Dr. Greg Thompson"; names already prefixed are kept as typed. */
function withDoctorTitle(name: string): string {
  const n = name.trim();
  return /^dr\.?\s/i.test(n) ? n : `Dr. ${n}`;
}

export async function AdjustmentsInActionSection() {
  let items: DoctorMediaItem[] = [];
  const nameByKey = new Map<DoctorMediaItem["doctorKey"], string>();
  try {
    const [c, cms] = await Promise.all([getSiteOwnerConfig(), getContentMany([...DOCTOR_CMS_KEYS])]);
    const doctors = await getDoctorsForMarketing(cms, c.doctorMedia);
    for (const d of doctors) nameByKey.set(d.doctorKey, withDoctorTitle(d.name));
    items = [...c.doctorMedia]
      .filter((m) => m.mediaType === "photo" && nameByKey.has(m.doctorKey))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  } catch {
    items = [];
  }

  if (items.length === 0) {
    return null;
  }

  const t = await getUiText();
  const named = [...nameByKey.values()];
  const suffix = t.ui_adjustments_line_suffix;
  const namedLine =
    named.length === 0
      ? t.ui_adjustments_line_none
      : named.length === 1
        ? `${named[0]} ${suffix}`
        : named.length === 2
          ? `${named[0]} and ${named[1]} ${suffix}`
          : `${named.slice(0, -1).join(", ")}, and ${named[named.length - 1]} ${suffix}`;

  return (
    <section
      aria-labelledby="adjustments-action-heading"
      className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10"
    >
      <h2 id="adjustments-action-heading" className="text-3xl font-black text-[#4a1515]">
        {t.ui_adjustments_heading}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">{namedLine}</p>
      <div className="mt-8 columns-1 gap-4 sm:columns-2">
        {items.map((m) => {
          const doctorName = nameByKey.get(m.doctorKey) ?? "";
          const caption = `${t.ui_adjustment_by_prefix} ${doctorName}`;
          const src = m.url;
          return (
            <figure
              key={m.id}
              className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow"
            >
              <div className="relative w-full bg-stone-200">
                <Image
                  src={src}
                  alt={caption}
                  width={1200}
                  height={900}
                  className="h-auto w-full object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  unoptimized={src.startsWith("http")}
                />
              </div>
              <figcaption className="space-y-1 p-3 text-xs">
                {m.caption ? <p className="italic text-[#c0392b]">{m.caption}</p> : null}
                <p className="font-semibold uppercase tracking-wide text-stone-500">{caption}</p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
