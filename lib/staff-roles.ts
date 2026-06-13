export type StaffRole = "massage_therapist" | "front_desk" | "manager" | "superadmin";

export const STAFF_ROLES: StaffRole[] = [
  "massage_therapist",
  "front_desk",
  "manager",
  "superadmin",
];

const LEGACY_ROLE_MAP: Record<string, StaffRole> = {
  admin: "front_desk",
  superadmin: "superadmin",
};

export const ROLE_RANK: Record<StaffRole, number> = {
  massage_therapist: 1,
  front_desk: 2,
  manager: 3,
  superadmin: 4,
};

export type StaffCapabilities = {
  operations: boolean;
  siteContent: boolean;
  marketing: boolean;
  deskWrite: boolean;
};

export function staffCapabilities(role: StaffRole): StaffCapabilities {
  const rank = ROLE_RANK[role];
  return {
    operations: rank >= ROLE_RANK.manager,
    siteContent: rank >= ROLE_RANK.manager,
    marketing: rank >= ROLE_RANK.manager,
    deskWrite: rank >= ROLE_RANK.front_desk,
  };
}

export function normalizeStaffRole(raw: unknown): StaffRole | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if ((STAFF_ROLES as string[]).includes(trimmed)) return trimmed as StaffRole;
  return LEGACY_ROLE_MAP[trimmed] ?? null;
}

export function staffMeetsMin(role: StaffRole, minRole: StaffRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export function canAssignRole(actor: StaffRole, target: StaffRole): boolean {
  if (!staffMeetsMin(actor, "manager")) return false;
  if (target === "superadmin") return actor === "superadmin";
  return staffMeetsMin(actor, "manager");
}

export const STAFF_ROLE_OPTIONS: {
  value: StaffRole;
  label: string;
  description: string;
}[] = [
  {
    value: "massage_therapist",
    label: "Massage therapist",
    description: "View today’s schedule for their linked provider only (read-only).",
  },
  {
    value: "front_desk",
    label: "Front desk",
    description: "Bookings scheduler, cancel slots, patient lookup.",
  },
  {
    value: "manager",
    label: "Manager",
    description:
      "Front desk access plus Operations, Site content, and Banners & promos (gift card bar, homepage banner, booking toggle).",
  },
  {
    value: "superadmin",
    label: "Superadmin",
    description: "Full access including staff role assignment and system config.",
  },
];

export function staffRoleLabel(raw: unknown): string {
  const role = normalizeStaffRole(raw);
  if (!role) return typeof raw === "string" ? raw : "Unknown";
  return STAFF_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

/**
 * Which location(s) a staff login can see contact messages for.
 * "both" (default) keeps existing behavior; superadmins are always "both".
 */
export type StaffLocationScope = "paris" | "sulphur_springs" | "both";

export const STAFF_LOCATION_SCOPES: StaffLocationScope[] = [
  "both",
  "paris",
  "sulphur_springs",
];

export function normalizeStaffLocationScope(raw: unknown): StaffLocationScope {
  return raw === "paris" || raw === "sulphur_springs" ? raw : "both";
}

/** Effective scope: superadmins always see both, regardless of stored value. */
export function effectiveLocationScope(
  role: StaffRole,
  stored: StaffLocationScope,
): StaffLocationScope {
  return role === "superadmin" ? "both" : stored;
}

export const STAFF_LOCATION_SCOPE_OPTIONS: {
  value: StaffLocationScope;
  label: string;
}[] = [
  { value: "both", label: "Both locations" },
  { value: "paris", label: "Paris only" },
  { value: "sulphur_springs", label: "Sulphur Springs only" },
];

export function staffLocationScopeLabel(raw: unknown): string {
  const scope = normalizeStaffLocationScope(raw);
  return STAFF_LOCATION_SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? "Both locations";
}
