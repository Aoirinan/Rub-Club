import { getSiteOwnerConfig } from "@/lib/site-owner-config";

export async function AdjustmentsInActionSection() {
  let items: Awaited<ReturnType<typeof getSiteOwnerConfig>>["doctorMedia"] = [];
  try {
    const c = await getSiteOwnerConfig();
    items = [...c.doctorMedia].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  } catch {
    items = [];
  }
  if (items.length === 0) return null;

  const doctorLabel: Record<string, string> = {
    greg: "Dr. Greg Thompson",
    sean: "Dr. Sean Welborn",
    brandy: "Dr. Brandy Collins",
  };

  return (
    <section
      aria-labelledby="adjustments-action"
      className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
    >
      <h2 id="adjustments-action" className="text-3xl font-black text-[#173f3b]">
        Adjustments in action
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Photos and video from chiropractic visits — shared with patient permission.
      </p>
      <div className="mt-8 columns-1 gap-4 sm:columns-2">
        {items.map((m) => (
          <figure
            key={m.id}
            className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow"
          >
            {m.mediaType === "video" ? (
              <video
                className="w-full bg-black object-contain"
                src={m.url}
                muted
                loop
                playsInline
                preload="metadata"
                onMouseEnter={(e) => {
                  void e.currentTarget.play().catch(() => {});
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={m.caption || "Chiropractic adjustment"} className="w-full object-cover" loading="lazy" />
            )}
            <figcaption className="p-3 text-xs text-stone-700">
              <span className="font-bold text-[#0f5f5c]">
                Adjustment by {doctorLabel[m.doctorKey] ?? m.doctorKey}
              </span>
              {m.caption ? <span className="mt-1 block text-stone-600">{m.caption}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
