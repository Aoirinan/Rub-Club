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
    siteContent: rank >= ROLE_RANK.superadmin,
    marketing: rank >= ROLE_RANK.superadmin,
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
    description: "Front desk access plus Operations (staff, providers, intake).",
  },
  {
    value: "superadmin",
    label: "Superadmin",
    description: "Full access including site content and marketing.",
  },
];

export function staffRoleLabel(raw: unknown): string {
  const role = normalizeStaffRole(raw);
  if (!role) return typeof raw === "string" ? raw : "Unknown";
  return STAFF_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}
