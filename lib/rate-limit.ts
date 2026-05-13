import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "./firebase-admin";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? "wellness-paris-tx";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function assertRateLimitOk(
  headers: Headers,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const ip = getClientIp(headers);
  const windowStart = Math.floor(Date.now() / WINDOW_MS);
  const id = `${hashIp(ip)}_${windowStart}`;
  const db = getFirestore();
  const ref = db.collection("rate_limits").doc(id);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists ? (snap.get("count") as number) : 0;
      if (current >= MAX_PER_WINDOW) {
        throw new Error("rate_limited");
      }
      tx.set(
        ref,
        {
          count: current + 1,
          windowStart,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Error && e.message === "rate_limited") {
      const elapsed = Date.now() % WINDOW_MS;
      const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000));
      return { ok: false, retryAfterSec };
    }
    throw e;
  }
}
