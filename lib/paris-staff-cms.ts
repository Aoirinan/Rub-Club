import { getContentMany } from "@/lib/cms";
import type { ContentFieldMeta } from "@/lib/cms";
import { PARIS_OFFICE_STAFF, type ParisOfficeStaffMember } from "@/lib/paris-office-staff";

export function parisStaffBioId(name: string): string {
  const key = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `paris_staff_${key}_bio`;
}

export function buildParisStaffCmsRegistry(): ContentFieldMeta[] {
  return PARIS_OFFICE_STAFF.map((member) => ({
    id: parisStaffBioId(member.name),
    pageLabel: "Paris staff" as const,
    sectionLabel: "Staff bios",
    fieldLabel: `${member.name} — ${member.role}`,
    type: "richtext" as const,
  }));
}

export function buildParisStaffCmsDefaults(): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const member of PARIS_OFFICE_STAFF) {
    defaults[parisStaffBioId(member.name)] = member.bio;
  }
  return defaults;
}

export async function getParisOfficeStaffForDisplay(): Promise<ParisOfficeStaffMember[]> {
  const bioIds = PARIS_OFFICE_STAFF.map((m) => parisStaffBioId(m.name));
  const cms = await getContentMany(bioIds);

  return PARIS_OFFICE_STAFF.map((member) => {
    const bio = cms[parisStaffBioId(member.name)]?.trim();
    return bio !== undefined && bio !== "" ? { ...member, bio } : member;
  });
}
