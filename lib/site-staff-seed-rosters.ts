/**
 * Default office staff rosters used only for one-time Firestore seeding.
 * After seed, manage members in Admin → Office staff.
 */

import type { ParisStaffImageKey } from "@/lib/paris-staff-images";

export type ParisOfficeStaffSeedEntry = {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageKey: ParisStaffImageKey;
};

export const PARIS_OFFICE_STAFF_SEED: readonly ParisOfficeStaffSeedEntry[] = [
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

export type SSStaffSeedEntry = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
};

export const SS_STAFF_SEED: readonly SSStaffSeedEntry[] = [
  {
    id: "dr_conner_collins",
    name: "Dr. Conner Collins",
    role: "Chiropractor",
    image: "/images/staff-ss/conner-collins.webp",
    bio: "Dr. Conner Collins is a chiropractor who takes a practical, hands-on approach to patient care, focusing on getting people out of pain and back to doing what they love. He specializes in treating spine and extremity conditions, including injuries from motor vehicle collisions and chronic musculoskeletal issues.\n\nBefore entering the healthcare field, Conner grew up working blue-collar jobs, including construction, oil fields, and cowboying. That background gives him a unique perspective on how the body moves, breaks down, and recovers—especially for patients who work hard physically. He understands the demands of that lifestyle and tailors his treatment approach to match real-world function, not just textbook outcomes.\n\nDr. Conner uses a combination of chiropractic techniques, including diversified, drop table, and Activator methods, along with soft tissue therapy, therapeutic exercise, and mechanical traction to help restore movement, reduce pain, and improve overall function. Outside of the clinic, he enjoys riding horses, working on his farm, and spending time outdoors. His goal is simple: help patients feel better, move better, and get back to living their lives.",
  },
  {
    id: "jade_petty",
    name: "Jade Petty",
    role: "Receptionist",
    image: "/images/staff-ss/jade-petty.webp",
    bio: "",
  },
  {
    id: "taylor_harrison",
    name: "Taylor Harrison",
    role: "Receptionist",
    image: "/images/staff-ss/taylor-harrison.webp",
    bio: "",
  },
  {
    id: "leotta_cascia",
    name: "Leotta Cascia",
    role: "Massage Therapist",
    image: "/images/staff-ss/leotta-cascia.webp",
    bio: "",
  },
  {
    id: "brittany_brown",
    name: "Brittany Brown",
    role: "Massage Therapist",
    bio: "",
  },
  {
    id: "ashlyn_davis",
    name: "Ashlyn Davis",
    role: "Rehab Therapy",
    bio: "",
  },
] as const;
