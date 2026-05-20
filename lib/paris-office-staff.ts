/**
 * Paris main-office support staff (Chiropractic Associates).
 * Sourced from chiropracticparistexas.com/staff — distinct from Rub Club massage therapists.
 */

export type ParisOfficeStaffMember = {
  name: string;
  role: string;
  bio: string;
  image?: string;
};

export const PARIS_OFFICE_STAFF: readonly ParisOfficeStaffMember[] = [
  {
    name: "Brandi Boren",
    role: "Insurance Coordinator",
    bio: "",
  },
  {
    name: "Sarah Brown",
    role: "Personal Injury Case Manager",
    bio: "",
  },
  {
    name: "Shauna Clark",
    role: "Therapy Tech",
    bio: "",
  },
  {
    name: "Shelbie Guthrie",
    role: "Stretch & Flex Rehab Coach",
    bio: "",
  },
  {
    name: "Ashlie Jenkins",
    role: "Front Desk Receptionist",
    bio: "",
  },
  {
    name: "Channety Wooten",
    role: "Marketing",
    bio: "",
  },
] as const;
