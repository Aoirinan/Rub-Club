import { requireStaff } from "@/lib/staff-auth";
import { isSuperadminRequest } from "@/lib/superadmin-auth";

export type OwnerMarketingAuth =
  | { ok: true; via: "staff"; email?: string }
  | { ok: true; via: "cookie" }
  | { ok: false };

/** Manager Firebase token or legacy owner-password cookie. */
export async function authorizeOwnerMarketing(req: Request): Promise<OwnerMarketingAuth> {
  const staff = await requireStaff(req.headers.get("authorization"), "superadmin");
  if (staff) return { ok: true, via: "staff", email: staff.email };
  if (await isSuperadminRequest(req.headers.get("cookie"))) return { ok: true, via: "cookie" };
  return { ok: false };
}

export function unauthorizedOwnerMarketing(): Response {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
