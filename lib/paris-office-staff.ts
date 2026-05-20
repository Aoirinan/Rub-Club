/**
 * Paris main-office support staff (Chiropractic Associates).
 * `id` is the stable CMS key; name/role/bio/photo are editable in Site content.
 */

import type { ParisStaffImageKey } from "@/lib/paris-staff-images";

export type ParisOfficeStaffRosterEntry = {
  /** Stable key for CMS fields (do not change after launch). */
  id: string;
  name: string;
  role: string;
  bio: string;
  imageKey: ParisStaffImageKey;
};

export type ParisOfficeStaffMember = ParisOfficeStaffRosterEntry & {
  image?: string;
};

export const PARIS_OFFICE_STAFF: readonly ParisOfficeStaffRosterEntry[] = [
  {
    id: "brandi_boren",
    name: "Brandi Boren",
    role: "Insurance Coordinator",
    bio: "",
    imageKey: "brandiBoren",
  },
  {
    id: "sarah_brown",
    name: "Sarah Brown",
    role: "Personal Injury Case Manager",
    bio: "",
    imageKey: "sarahBrown",
  },
  {
    id: "shauna_clark",
    name: "Shauna Clark",
    role: "Therapy Tech",
    bio: "",
    imageKey: "shaunaClark",
  },
  {
    id: "shelbie_guthrie",
    name: "Shelbie Guthrie",
    role: "Stretch & Flex Rehab Coach",
    bio: "",
    imageKey: "shelbieGuthrie",
  },
  {
    id: "ashlie_jenkins",
    name: "Ashlie Jenkins",
    role: "Front Desk Receptionist",
    bio: "",
    imageKey: "ashlieJenkins",
  },
  {
    id: "channety_wooten",
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
