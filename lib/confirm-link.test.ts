import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * app/api/confirm/route.ts — the "confirm my appointment" link must not change
 * anything on GET (link previews fetch it before the patient taps); the booking
 * page confirms with a POST instead.
 */

const state = vi.hoisted(() => ({
  booking: null as null | Record<string, unknown>,
  update: vi.fn(async () => undefined),
  getFirestore: vi.fn(),
  rateLimit: vi.fn(async () => ({ ok: true }) as { ok: true } | { ok: false; retryAfterSec: number }),
}));

vi.mock("@/lib/site-content", () => ({
  getSiteOrigin: () => "https://www.chiropracticparistexas.com",
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimitOk: state.rateLimit }));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TS" },
}));
vi.mock("@/lib/firebase-admin", () => ({ getFirestore: state.getFirestore }));

import { GET, POST } from "@/app/api/confirm/route";

function fakeDb() {
  return {
    collection: () => ({
      where: (_field: string, _op: string, token: string) => ({
        limit: () => ({
          get: async () => {
            const b = state.booking;
            const hit = b && b.confirmToken === token;
            return {
              empty: !hit,
              docs: hit ? [{ get: (k: string) => b[k], ref: { update: state.update } }] : [],
            };
          },
        }),
      }),
    }),
  };
}

const TOKEN = "0123456789abcdef0123456789abcdef0123";

function post(body: unknown) {
  return POST(
    new Request("https://www.chiropracticparistexas.com/api/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  state.booking = { confirmToken: TOKEN, status: "pending", confirmationStatus: "unconfirmed" };
  state.update.mockClear();
  state.rateLimit.mockClear();
  state.rateLimit.mockImplementation(async () => ({ ok: true }));
  state.getFirestore.mockReset();
  state.getFirestore.mockImplementation(fakeDb);
});

describe("GET /api/confirm", () => {
  it("only redirects to the booking page with the token in the fragment", async () => {
    const res = await GET(new Request(`https://x.test/api/confirm?token=${TOKEN}`));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      `https://www.chiropracticparistexas.com/book#confirm=${TOKEN}`,
    );
    expect(state.getFirestore).not.toHaveBeenCalled();
    expect(state.rateLimit).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
  });

  it("sends a missing or malformed token to the same invalid page as before", async () => {
    for (const q of ["", "?token=", "?token=short", `?token=${"a".repeat(300)}`]) {
      const res = await GET(new Request(`https://x.test/api/confirm${q}`));
      expect(res.headers.get("location")).toBe(
        "https://www.chiropracticparistexas.com/book?confirm=invalid",
      );
    }
    expect(state.getFirestore).not.toHaveBeenCalled();
  });

  it("always redirects to the site's own origin, whatever host the link used", async () => {
    const res = await GET(new Request(`https://evil.example/api/confirm?token=${TOKEN}`));
    expect(new URL(res.headers.get("location")!).origin).toBe(
      "https://www.chiropracticparistexas.com",
    );
  });
});

describe("POST /api/confirm", () => {
  it("confirms a pending visit", async () => {
    const res = await post({ token: TOKEN });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(state.update).toHaveBeenCalledWith({
      confirmationStatus: "confirmed_online",
      confirmClickedAt: "SERVER_TS",
    });
    expect(state.rateLimit).toHaveBeenCalledWith(expect.anything(), {
      bucket: "confirm",
      maxPerWindow: 60,
    });
  });

  it("is idempotent for a visit already confirmed online", async () => {
    state.booking = { ...state.booking, status: "confirmed", confirmationStatus: "confirmed_online" };
    const res = await post({ token: TOKEN });
    expect(await res.json()).toEqual({ ok: true });
    expect(state.update).not.toHaveBeenCalled();
  });

  it("never flips a cancelled or declined visit", async () => {
    for (const status of ["cancelled", "declined"]) {
      state.booking = { ...state.booking, status };
      const res = await post({ token: TOKEN });
      expect(res.status).toBe(409);
      expect((await res.json()).ok).toBe(false);
    }
    expect(state.update).not.toHaveBeenCalled();
  });

  it("rejects unknown and malformed tokens", async () => {
    expect((await post({ token: "ffffffffffffffff" })).status).toBe(404);
    expect((await post({ token: "short" })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect((await post("not json")).status).toBe(400);
    expect(state.update).not.toHaveBeenCalled();
  });

  it("is rate limited", async () => {
    state.rateLimit.mockImplementation(async () => ({ ok: false, retryAfterSec: 42 }));
    const res = await post({ token: TOKEN });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("42");
    expect(state.getFirestore).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
  });
});
