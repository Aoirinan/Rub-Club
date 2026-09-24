/**
 * Whether Square online checkout can work here: lib/square.ts creates payment
 * links only when both of these are set. Server-only (reads env).
 */
export function squareCheckoutConfigured(): boolean {
  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN?.trim() && process.env.SQUARE_LOCATION_ID?.trim(),
  );
}
