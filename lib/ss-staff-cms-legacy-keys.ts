import { staffCmsSlug } from "@/lib/staff-cms-id";

export function ssStaffNameId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_name`;
}

export function ssStaffRoleId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_role`;
}

export function ssStaffBioId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_bio`;
}

export function ssStaffPhotoId(staffId: string): string {
  return `ss_staff_${staffCmsSlug(staffId)}_photo`;
}
