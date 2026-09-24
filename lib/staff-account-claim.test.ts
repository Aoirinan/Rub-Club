import { describe, expect, it } from "vitest";
import type { Auth, UserRecord } from "firebase-admin/auth";
import {
  providersToUnlinkBeforeClaim,
  secureUnclaimedAuthAccount,
  signInPredatesClaim,
} from "./staff-account-claim";

describe("providersToUnlinkBeforeClaim", () => {
  it("keeps only email/password", () => {
    expect(providersToUnlinkBeforeClaim(["password"])).toEqual([]);
    expect(providersToUnlinkBeforeClaim(["password", "phone", "google.com", "phone"])).toEqual([
      "phone",
      "google.com",
    ]);
  });
});

describe("signInPredatesClaim", () => {
  const claimedAt = Date.UTC(2026, 8, 23, 15, 0, 0);

  it("never applies to staff records without a claim time", () => {
    expect(signInPredatesClaim(1, undefined)).toBe(false);
  });

  it("refuses sign-ins from before the claim and allows later ones", () => {
    expect(signInPredatesClaim(claimedAt / 1000 - 60, claimedAt)).toBe(true);
    expect(signInPredatesClaim(claimedAt / 1000, claimedAt)).toBe(false);
    expect(signInPredatesClaim(claimedAt / 1000 + 60, claimedAt)).toBe(false);
  });

  it("refuses a token with no sign-in time once a claim time is set", () => {
    expect(signInPredatesClaim(undefined, claimedAt)).toBe(true);
  });
});

describe("secureUnclaimedAuthAccount", () => {
  function fakeAuth(tokensValidAfterTime: string | undefined) {
    const calls: { op: string; uid: string; props?: Record<string, unknown> }[] = [];
    const auth = {
      updateUser: async (uid: string, props: Record<string, unknown>) => {
        calls.push({ op: "updateUser", uid, props });
      },
      revokeRefreshTokens: async (uid: string) => {
        calls.push({ op: "revokeRefreshTokens", uid });
      },
      getUser: async (uid: string) => {
        calls.push({ op: "getUser", uid });
        return { uid, tokensValidAfterTime };
      },
    };
    return { auth: auth as unknown as Auth, calls };
  }

  const user = {
    uid: "u1",
    providerData: [{ providerId: "password" }, { providerId: "phone" }],
  } as unknown as UserRecord;

  it("resets the password, drops other sign-in methods, then revokes sessions", async () => {
    const { auth, calls } = fakeAuth("Wed, 23 Sep 2026 15:00:00 GMT");
    const validAfter = await secureUnclaimedAuthAccount(auth, user);

    expect(calls.map((c) => c.op)).toEqual(["updateUser", "revokeRefreshTokens", "getUser"]);
    const props = calls[0]!.props!;
    expect(typeof props.password).toBe("string");
    expect((props.password as string).length).toBeGreaterThanOrEqual(24);
    expect(props.providersToUnlink).toEqual(["phone"]);
    expect(validAfter).toBe(Date.UTC(2026, 8, 23, 15, 0, 0));
  });

  it("uses a fresh random password each time", async () => {
    const a = fakeAuth("Wed, 23 Sep 2026 15:00:00 GMT");
    const b = fakeAuth("Wed, 23 Sep 2026 15:00:00 GMT");
    await secureUnclaimedAuthAccount(a.auth, user);
    await secureUnclaimedAuthAccount(b.auth, user);
    expect(a.calls[0]!.props!.password).not.toBe(b.calls[0]!.props!.password);
  });

  it("falls back to now when Firebase reports no revocation time", async () => {
    const { auth } = fakeAuth(undefined);
    const before = Date.now();
    const validAfter = await secureUnclaimedAuthAccount(auth, {
      uid: "u1",
      providerData: [{ providerId: "password" }],
    } as unknown as UserRecord);
    expect(validAfter).toBeGreaterThanOrEqual(before);
  });
});
