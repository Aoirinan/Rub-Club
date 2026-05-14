import crypto from "crypto";

const TOKEN_BYTES = 32;

export function generatePatientPortalToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashPatientPortalToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim(), "utf8").digest("hex");
}
