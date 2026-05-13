import { CHIRO, CHIRO_INTRO_VIDEO_SRC } from "@/lib/home-verbatim";

export function IntroVideoBlock() {
  return (
    <div className="mx-auto max-w-[750px] text-center">
      <p className="text-sm font-bold text-[#173f3b] sm:text-base">{CHIRO.introVideoHeading}</p>
      <video
        className="mt-4 w-full max-h-[60vh] bg-black shadow-lg ring-1 ring-stone-200"
        controls
        playsInline
        preload="metadata"
        width={750}
        height={381}
      >
        <source src={CHIRO_INTRO_VIDEO_SRC} type="video/mp4" />
      </video>
    </div>
  );
}
