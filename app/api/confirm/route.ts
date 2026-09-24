import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { assertRateLimitOk } from "@/lib/rate-limit";
import { getSiteOrigin } from "@/lib/site-content";

export const runtime = "nodejs";

/** Real tokens are 36 hex chars (randomBytes(18)); anything far outside that is not one. */
const MIN_TOKEN_LENGTH = 8;
const MAX_TOKEN_LENGTH = 256;

function isPlausibleToken(token: string): boolean {
  return token.length >= MIN_TOKEN_LENGTH && token.length <= MAX_TOKEN_LENGTH;
}

/**
 * The "confirm my appointment" link in the email/SMS reminder.
 *
 * Changes nothing: link-preview fetchers (iMessage, Android Messages, mail
 * scanners) open links before the patient taps them, so a GET that confirmed
 * would mark visits "confirmed online" on its own. It only sends the browser
 * to the booking page with the token in the URL fragment — never sent to a
 * server, and ignored by fetchers that don't run scripts. The page's
 * <ConfirmFromLink> (app/book/ConfirmFromLink.tsx) then confirms with a POST
 * below, so it is still one tap for the patient. Old links keep working.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  // Same-origin redirects only: the destination is always the site's own origin.
  const origin = getSiteOrigin();
  if (!isPlausibleToken(token)) {
    return NextResponse.redirect(new URL("/book?confirm=invalid", origin));
  }
  const dest = new URL("/book", origin);
  dest.hash = `confirm=${encodeURIComponent(token)}`;
  const res = NextResponse.redirect(dest);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

/** Confirms the visit for `{ token }`; called by the booking page, never by a link. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!isPlausibleToken(token)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const rl = await assertRateLimitOk(req.headers, { bucket: "confirm", maxPerWindow: 60 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Try again soon." },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  const db = getFirestore();
  const snap = await db.collection("bookings").where("confirmToken", "==", token).limit(1).get();
  if (snap.empty) return NextResponse.json({ ok: false }, { status: 404 });

  const doc = snap.docs[0]!;
  const status = doc.get("status");
  // A cancelled / declined visit must not be flipped to "confirmed online".
  if (status !== "pending" && status !== "confirmed") {
    return NextResponse.json({ ok: false }, { status: 409 });
  }

  if (doc.get("confirmationStatus") !== "confirmed_online") {
    await doc.ref.update({
      confirmationStatus: "confirmed_online",
      confirmClickedAt: FieldValue.serverTimestamp(),
    });
  }

  return NextResponse.json({ ok: true });
}
