import Image from "next/image";
import { AdjustmentMediaVideo } from "@/components/AdjustmentMediaVideo";
import { DOCTOR_MEDIA_FULL_NAME, loadDoctorMediaFromJson } from "@/lib/doctor-media-json";

export async function AdjustmentsInActionSection() {
  const items = await loadDoctorMediaFromJson();

  if (items.length === 0) {
    return (
      <section
        aria-labelledby="adjustments-action-heading"
        className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
      >
        <h2 id="adjustments-action-heading" className="text-3xl font-black text-[#173f3b]">
          Adjustments in Action
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Watch Dr. Greg Thompson and Dr. Sean Welborn at work.
        </p>
        <div className="mt-8 flex min-h-[180px] items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-6 text-center text-stone-600">
          Photos and videos of our doctors in action coming soon.
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="adjustments-action-heading"
      className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10"
    >
      <h2 id="adjustments-action-heading" className="text-3xl font-black text-[#173f3b]">
        Adjustments in Action
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Watch Dr. Greg Thompson and Dr. Sean Welborn at work.
      </p>
      <div className="mt-8 columns-1 gap-4 sm:columns-2">
        {items.map((m) => {
          const doctorFull = DOCTOR_MEDIA_FULL_NAME[m.doctor];
          const alt = `Adjustment by Dr. ${doctorFull}`;
          const src = `/media/doctors/${m.filename}`;
          return (
            <figure
              key={m.id}
              className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow"
            >
              {m.type === "video" ? (
                <AdjustmentMediaVideo src={src} />
              ) : (
                <div className="relative w-full bg-stone-200">
                  <Image
                    src={src}
                    alt={alt}
                    width={1200}
                    height={900}
                    className="h-auto w-full object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
              )}
              <figcaption className="space-y-1 p-3 text-xs">
                {m.caption ? <p className="italic text-[#0f5f5c]">{m.caption}</p> : null}
                <p className="font-semibold uppercase tracking-wide text-stone-500">
                  Adjustment by Dr. {doctorFull}
                </p>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
