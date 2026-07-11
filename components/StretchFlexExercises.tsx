import Image from "next/image";
import type { StretchFlexExercise } from "@/lib/stretch-flex";

/**
 * Stretch & Flex Rehab exercises (CURSOR_PROMPT §7): each movement's name,
 * verbatim instructions, and photo gallery (next/image, lazy-loaded below the
 * fold). Exercises with no photos yet render name + instructions only.
 *
 * `photos` are the editable page gallery images (CMS: Stretch & Flex Rehab →
 * Gallery photo 1/2/3) shown beside the movement list.
 */
export function StretchFlexExercises({
  exercises,
  photos = [],
}: {
  exercises: StretchFlexExercise[];
  photos?: string[];
}) {
  const gallery = photos.map((p) => p.trim()).filter(Boolean);
  if (!exercises.length && !gallery.length) return null;

  return (
    <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
      <h2 className="text-2xl font-black text-[#4a1515]">Exercises &amp; movements</h2>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-10">
          {exercises.map((ex) => (
            <div key={ex.id}>
              <h3 className="text-lg font-black text-[#4a1515]">{ex.name}</h3>
              {ex.instructions.trim() ? (
                <p className="mt-2 leading-relaxed text-stone-700">{ex.instructions}</p>
              ) : null}
              {ex.images.length ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {ex.images.map((img, i) => (
                    <figure
                      key={i}
                      className="overflow-hidden rounded-lg border border-stone-200 shadow-sm"
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={img.url}
                          alt={img.alt || ex.name}
                          fill
                          loading="lazy"
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-cover"
                        />
                      </div>
                      {img.caption ? (
                        <figcaption className="px-3 py-2 text-sm text-stone-500">
                          {img.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {gallery.length ? (
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:gap-4">
            {gallery.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 shadow-sm"
              >
                <Image
                  src={src}
                  alt="Stretch & Flex Rehab"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 30vw, 320px"
                  className="object-cover"
                  unoptimized={src.startsWith("http")}
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
