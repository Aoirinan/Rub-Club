/** Shared caps for owner marketing uploads (client + server). */
export const OWNER_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const OWNER_IMAGE_MAX_BYTES = 25 * 1024 * 1024;

/** Max videos sitewide (testimonial + doctor adjustment videos combined). */
export const OWNER_MAX_TOTAL_VIDEOS = 30;
/** Max adjustment videos per chiropractor in doctor media. */
export const OWNER_MAX_VIDEOS_PER_DOCTOR = 6;
/** Max testimonial videos tagged to one massage therapist. */
export const OWNER_MAX_VIDEOS_PER_MASSAGE_MEMBER = 4;

const TESTIMONIAL_VIDEO_EXT_TO_MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
};

/** When `File.type` is empty (common on some Windows browsers), infer MIME from extension. */
export function resolveOwnerTestimonialVideoContentType(file: { name: string; type: string }): string | null {
  const t = (file.type || "").trim();
  if (t === "video/mp4" || t === "video/quicktime" || t === "video/webm") return t;
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  return TESTIMONIAL_VIDEO_EXT_TO_MIME[ext] ?? null;
}

/** Resolves content-type for doctor media uploads (photo or video). */
export function resolveOwnerDoctorMediaContentType(
  file: { name: string; type: string },
  mediaType: "photo" | "video",
): string | null {
  if (mediaType === "video") return resolveOwnerTestimonialVideoContentType(file);
  const t = (file.type || "").trim();
  if (t === "image/jpeg" || t === "image/png" || t === "image/webp") return t;
  const n = file.name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  return null;
}
