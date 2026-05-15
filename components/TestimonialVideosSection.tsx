import { getSiteOwnerConfig } from "@/lib/site-owner-config";

export async function TestimonialVideosSection() {
  let items: Awaited<ReturnType<typeof getSiteOwnerConfig>>["testimonialVideos"] = [];
  try {
    const c = await getSiteOwnerConfig();
    items = c.testimonialVideos;
  } catch {
    items = [];
  }
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="patient-videos"
      className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
    >
      <h2 id="patient-videos" className="text-3xl font-black text-[#173f3b]">
        What our patients say
      </h2>
      <p className="mt-2 text-sm text-stone-600">Video testimonials from real visits.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => (
          <article
            key={v.id}
            className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-md"
          >
            <div className="aspect-video bg-black">
              <video
                className="h-full w-full object-contain"
                src={v.url}
                controls
                preload="metadata"
                playsInline
              >
                <track kind="captions" />
              </video>
            </div>
            <div className="space-y-1 p-4">
              {v.title ? <h3 className="font-bold text-[#173f3b]">{v.title}</h3> : null}
              {v.label ? <p className="text-xs text-stone-600">{v.label}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
