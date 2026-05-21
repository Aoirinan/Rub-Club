import { staffCmsSlug } from "@/lib/staff-cms-id";

export function parisStaffNameId(staffId: string): string {
  return `paris_staff_${staffCmsSlug(staffId)}_name`;
}

export function parisStaffRoleId(staffId: string): string {
  return `paris_staff_${staffCmsSlug(staffId)}_role`;
}

export function parisStaffBioId(staffId: string): string {
  return `paris_staff_${staffCmsSlug(staffId)}_bio`;
}

export function parisStaffPhotoId(staffId: string): string {
  return `paris_staff_${staffCmsSlug(staffId)}_photo`;
}
