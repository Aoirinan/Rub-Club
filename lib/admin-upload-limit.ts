/**
 * Client-side guard for admin uploads that go through our API routes.
 *
 * Vercel rejects any function request body over 4.5 MB before the route runs,
 * and its rejection is not JSON — so the routes' own (larger) limits never
 * apply and `res.json()` throws a parse error. Check sizes before sending and
 * read upload responses defensively. (Uploads that PUT straight to Storage via
 * a signed URL are not affected.)
 */

/** Vercel's request-body cap (decimal MB, the conservative reading). */
export const ADMIN_UPLOAD_LIMIT_BYTES = 4_500_000;
export const ADMIN_UPLOAD_LIMIT_LABEL = "4.5 MB";

export const ADMIN_UPLOAD_MAYBE_TOO_LARGE = `Upload failed — the file may be too large (limit ${ADMIN_UPLOAD_LIMIT_LABEL}).`;

/** Size in MB for messages, rounded up so an over-limit file never reads as "4.5". */
function formatMb(bytes: number): string {
  return (Math.ceil(bytes / 100_000) / 10).toFixed(1);
}

/**
 * Message to show instead of sending, or null when the files fit. Pass every
 * file that goes in the same request (e.g. a photo and a video together).
 */
export function adminUploadTooLargeMessage(
  files: File | ReadonlyArray<File | null | undefined>,
): string | null {
  const list = (Array.isArray(files) ? files : [files]).filter((f): f is File => Boolean(f));
  const total = list.reduce((sum, f) => sum + f.size, 0);
  if (total <= ADMIN_UPLOAD_LIMIT_BYTES) return null;
  const what = list.length > 1 ? "These files are" : "This file is";
  return `${what} ${formatMb(total)} MB; the upload limit is ${ADMIN_UPLOAD_LIMIT_LABEL} — please use a smaller file.`;
}

/**
 * Parse an upload response. A body that is not JSON (Vercel's size rejection,
 * a gateway error page) comes back as `{ error: ADMIN_UPLOAD_MAYBE_TOO_LARGE }`
 * so callers can keep using `data.error`.
 */
export async function readAdminUploadJson<T extends object>(
  res: Response,
): Promise<T & { error?: string }> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { error: ADMIN_UPLOAD_MAYBE_TOO_LARGE } as T & { error?: string };
  }
  if (!data || typeof data !== "object") {
    return { error: ADMIN_UPLOAD_MAYBE_TOO_LARGE } as T & { error?: string };
  }
  if (res.status === 413 && typeof (data as { error?: unknown }).error !== "string") {
    return { ...(data as T), error: ADMIN_UPLOAD_MAYBE_TOO_LARGE };
  }
  return data as T & { error?: string };
}
