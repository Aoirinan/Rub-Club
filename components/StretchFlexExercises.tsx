import Image from "next/image";
import type { StretchFlexExercise } from "@/lib/stretch-flex";

/**
 * Stretch & Flex Rehab exercises (CURSOR_PROMPT §7): each movement's name,
 * verbatim instructions, and photo gallery (next/image, lazy-loaded below the
 * fold). Exercises with no photos yet render name + instructions only.
 */
export function StretchFlexExercises({ exercises }: { exercises: StretchFlexExercise[] }) {
  if (!exercises.length) return null;
  return (
    <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-10">
      <h2 className="text-2xl font-black text-[#4a1515]">Exercises &amp; movements</h2>
      <div className="mt-6 space-y-10">
        {exercises.map((ex) => (
          <div key={ex.id}>
            <h3 className="text-lg font-black text-[#4a1515]">{ex.name}</h3>
            {ex.instructions.trim() ? (
              <p className="mt-2 leading-relaxed text-stone-700">{ex.instructions}</p>
            ) : null}
            {ex.images.length ? (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ex.images.map((img, i) => (
                  <figure key={i} className="overflow-hidden rounded border border-stone-200">
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
    </section>
  );
}
