import { NextResponse } from "next/server";
import { z } from "zod";
import { sendSms } from "@/lib/twilio";
import { logSmsSent } from "@/lib/sms-audit";

export const runtime = "nodejs";

const bodySchema = z.object({
  to: z.string().min(7).max(40),
  body: z.string().min(1).max(1600),
  bookingId: z.string().max(120).optional(),
});

/**
 * Generic SMS stub/helper for internal tooling (Twilio when env is configured).
 */
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
  const result = await sendSms(parsed.data.to, parsed.data.body);
  if (result.sent) {
    await logSmsSent({
      phone: parsed.data.to,
      message: parsed.data.body,
      bookingId: parsed.data.bookingId ?? null,
    }).catch(() => {});
  }
  return NextResponse.json({ ok: result.sent, reason: result.sent ? undefined : result.reason });
}
