/**
 * Paris main-office support staff (Chiropractic Associates).
 * Sourced from chiropracticparistexas.com/staff — distinct from Rub Club massage therapists.
 */

import type { ParisStaffImageKey } from "@/lib/paris-staff-images";

export type ParisOfficeStaffMember = {
  name: string;
  role: string;
  bio: string;
  imageKey: ParisStaffImageKey;
  /** Resolved photo URL (CMS override or legacy CDN default). */
  image?: string;
};

export const PARIS_OFFICE_STAFF: readonly Omit<ParisOfficeStaffMember, "image">[] = [
  {
    name: "Brandi Boren",
    role: "Insurance Coordinator",
    bio: "",
    imageKey: "brandiBoren",
  },
  {
    name: "Sarah Brown",
    role: "Personal Injury Case Manager",
    bio: "",
    imageKey: "sarahBrown",
  },
  {
    name: "Shauna Clark",
    role: "Therapy Tech",
    bio: "",
    imageKey: "shaunaClark",
  },
  {
    name: "Shelbie Guthrie",
    role: "Stretch & Flex Rehab Coach",
    bio: "",
    imageKey: "shelbieGuthrie",
  },
  {
    name: "Ashlie Jenkins",
    role: "Front Desk Receptionist",
    bio: "",
    imageKey: "ashlieJenkins",
  },
  {
    name: "Channety Wooten",
    role: "Marketing",
    bio: "",
    imageKey: "channetyWooten",
  },
] as const;

export const PARIS_STAFF_PAGE_DEFAULTS = {
  heroTitle: "Meet Our Paris Office Team",
  heroLede:
    "Insurance, personal injury, front desk, therapy, and marketing — the people who keep our Paris office running smoothly. Licensed massage therapists are listed separately at The Rub Club.",
  sectionHeading: "Our Team",
  ctaTitle: "Questions about insurance or billing?",
  ctaBody:
    "Call our Paris office and our team will help verify benefits or walk you through personal injury and auto-injury paperwork.",
} as const;
