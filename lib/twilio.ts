import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getTwilioClient(): ReturnType<typeof twilio> | null {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!sid || !token) return null;
  client = twilio(sid, token);
  return client;
}

function getTwilioPhone(): string {
  return process.env.TWILIO_PHONE_NUMBER?.trim() ?? "";
}

/**
 * Normalize a US phone string like "903-785-5551" into E.164 "+19037855551".
 * Returns the original string if it already starts with "+".
 */
function toE164(phone: string): string {
  if (phone.startsWith("+")) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export type SmsResult =
  | { sent: true; sid: string }
  | { sent: false; reason: "missing_env" | "send_error"; detail?: string };

export async function sendSms(
  to: string,
  body: string,
): Promise<SmsResult> {
  const c = getTwilioClient();
  const from = getTwilioPhone();
  if (!c || !from) {
    console.warn("[twilio] Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER — SMS NOT sent to", to);
    return { sent: false, reason: "missing_env" };
  }

  try {
    const msg = await c.messages.create({
      to: toE164(to),
      from,
      body,
    });
    return { sent: true, sid: msg.sid };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[twilio] SMS send failed:", detail);
    return { sent: false, reason: "send_error", detail };
  }
}
