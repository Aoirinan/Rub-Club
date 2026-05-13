import { SquareClient, SquareEnvironment } from "square";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";

let client: SquareClient | null = null;

function getSquareClient(): SquareClient | null {
  if (client) return client;
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim();
  if (!token) return null;
  const env =
    process.env.SQUARE_ENVIRONMENT?.trim() === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;
  client = new SquareClient({ token, environment: env });
  return client;
}

function getLocationId(): string {
  return process.env.SQUARE_LOCATION_ID?.trim() ?? "";
}

export type PaymentLinkResult =
  | { created: true; url: string; orderId?: string; paymentLinkId: string }
  | { created: false; reason: "missing_env" | "api_error"; detail?: string };

/**
 * Create a Square Payment Link (hosted checkout) via the Quick Pay shortcut.
 * Returns the URL the patient can visit to pay.
 */
export async function createPaymentLink(params: {
  amountCents: number;
  patientName: string;
  bookingId: string;
  description?: string;
}): Promise<PaymentLinkResult> {
  const sq = getSquareClient();
  const locationId = getLocationId();
  if (!sq || !locationId) {
    console.warn("[square] Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID — payment link NOT created");
    return { created: false, reason: "missing_env" };
  }

  try {
    const resp = await sq.checkout.paymentLinks.create({
      idempotencyKey: randomUUID(),
      quickPay: {
        name: params.description || "Appointment payment",
        priceMoney: {
          amount: BigInt(params.amountCents),
          currency: "USD",
        },
        locationId,
      },
      paymentNote: `Booking ${params.bookingId} — ${params.patientName}`,
    });

    const link = resp.paymentLink;
    if (!link?.url) {
      return { created: false, reason: "api_error", detail: "No payment link URL in response" };
    }

    return {
      created: true,
      url: link.url,
      orderId: link.orderId,
      paymentLinkId: link.id ?? "",
    };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[square] Payment link creation failed:", detail);
    return { created: false, reason: "api_error", detail };
  }
}

/**
 * Verify a Square webhook signature. Returns true if valid.
 */
export function verifySquareWebhook(
  body: string,
  signature: string,
  notificationUrl: string,
): boolean {
  const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY?.trim();
  if (!sigKey) return false;

  try {
    const hmac = createHmac("sha256", sigKey);
    hmac.update(notificationUrl + body);
    const expected = hmac.digest("base64");
    return timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expected, "base64"),
    );
  } catch {
    return false;
  }
}
