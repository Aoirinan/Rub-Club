import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentLink } from "@/lib/square";

export const runtime = "nodejs";

/**
 * Creates a Square hosted checkout link when `SQUARE_ACCESS_TOKEN` + `SQUARE_LOCATION_ID`
 * are set and `bookingId` + `amountCents` are provided (note includes booking id for webhooks).
 * Otherwise returns a stub URL for development.
 */
const bodySchema = z.object({
  phone: z.string().min(7).max(40),
  bookingId: z.string().min(4).max(120).optional(),
  amountCents: z.number().int().positive().max(500_000).optional(),
  patientName: z.string().min(1).max(120).optional(),
  description: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { phone, bookingId, amountCents, patientName, description } = parsed.data;
  const displayName = patientName?.trim() || `Guest ${phone.replace(/\D/g, "").slice(-4)}`;

  if (bookingId && amountCents) {
    const linkResult = await createPaymentLink({
      amountCents,
      patientName: displayName,
      bookingId,
      description: description?.trim() || undefined,
    });
    if (linkResult.created) {
      return NextResponse.json({
        ok: true,
        url: linkResult.url,
        paymentLinkId: linkResult.paymentLinkId,
        message: "Square payment link created.",
      });
    }
    return NextResponse.json(
      {
        ok: false,
        reason: linkResult.reason,
        detail: linkResult.detail,
        url: null,
        message:
          linkResult.reason === "missing_env"
            ? "Square is not configured (set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID)."
            : `Square did not return a link: ${linkResult.detail ?? linkResult.reason}`,
      },
      { status: linkResult.reason === "missing_env" ? 503 : 502 },
    );
  }

  const stubUrl = `https://squareup.com/checkout/pay-stub?booking=${encodeURIComponent(bookingId ?? "unknown")}`;
  console.info("[square-link] stub response", { phone, bookingId: bookingId ?? null });
  return NextResponse.json({
    ok: true,
    url: stubUrl,
    message:
      "Stub URL — pass bookingId and amountCents to create a real Square link when credentials are configured.",
  });
}
