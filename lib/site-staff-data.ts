import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";

export const SITE_STAFF_COLLECTION = "site_staff_members";
export const SITE_STAFF_CACHE_TAG = "site-staff-public";

export type SiteStaffBrand = "paris" | "sulphur" | "both";

export type SiteStaffMemberStored = {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  photoStoragePath?: string;
  /** Optional intro video (e.g. "Meet Dr. Collins"), uploaded via the staff admin. */
  videoUrl?: string;
  videoStoragePath?: string;
  specialties: string[];
  brand: SiteStaffBrand;
  order: number;
  active: boolean;
  featured: boolean;
  createdAt?: FirebaseFirestore.Timestamp;
};

export type SiteStaffDisplayMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
  videoUrl?: string;
  featured: boolean;
};

const BRANDS: SiteStaffBrand[] = ["paris", "sulphur", "both"];

function normalizeBrand(raw: unknown): SiteStaffBrand | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  return BRANDS.includes(v as SiteStaffBrand) ? (v as SiteStaffBrand) : null;
}

function normalizePhotoUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim();
}

function memberMatchesBrand(brand: SiteStaffBrand, pageBrand: "paris" | "sulphur"): boolean {
  return brand === "both" || brand === pageBrand;
}

export function parseSiteStaffDoc(
  id: string,
  data: DocumentData | undefined,
): SiteStaffMemberStored | null {
  if (!data) return null;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!name || !title) return null;
  const brand = normalizeBrand(data.brand);
  if (!brand) return null;
  const bio = typeof data.bio === "string" ? data.bio : "";
  const photoUrl = normalizePhotoUrl(data.photoUrl);
  const order =
    typeof data.order === "number" && Number.isFinite(data.order) ? data.order : 0;
  const active = data.active !== false;
  const featured = data.featured === true;
  const specialties = Array.isArray(data.specialties)
    ? data.specialties
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const photoStoragePath =
    typeof data.photoStoragePath === "string" && data.photoStoragePath.trim()
      ? data.photoStoragePath.trim()
      : undefined;
  const videoUrl =
    typeof data.videoUrl === "string" && data.videoUrl.trim() ? data.videoUrl.trim() : undefined;
  const videoStoragePath =
    typeof data.videoStoragePath === "string" && data.videoStoragePath.trim()
      ? data.videoStoragePath.trim()
      : undefined;
  const createdAt =
    data.createdAt &&
    typeof data.createdAt === "object" &&
    "toDate" in data.createdAt &&
    typeof (data.createdAt as { toDate?: () => Date }).toDate === "function"
      ? (data.createdAt as FirebaseFirestore.Timestamp)
      : undefined;
  return {
    id,
    name,
    title,
    bio,
    photoUrl,
    ...(photoStoragePath ? { photoStoragePath } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(videoStoragePath ? { videoStoragePath } : {}),
    specialties,
    brand,
    order,
    active,
    featured,
    ...(createdAt ? { createdAt } : {}),
  };
}

function storedToDisplay(row: SiteStaffMemberStored): SiteStaffDisplayMember {
  return {
    id: row.id,
    name: row.name,
    role: row.title,
    bio: row.bio,
    ...(row.photoUrl ? { image: row.photoUrl } : {}),
    ...(row.videoUrl ? { videoUrl: row.videoUrl } : {}),
    featured: row.featured,
  };
}

function sortMembers(rows: SiteStaffMemberStored[]): SiteStaffMemberStored[] {
  return [...rows].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  });
}

export async function listSiteStaffMembers(db: Firestore): Promise<SiteStaffMemberStored[]> {
  const snap = await db.collection(SITE_STAFF_COLLECTION).get();
  const rows: SiteStaffMemberStored[] = [];
  for (const doc of snap.docs) {
    const row = parseSiteStaffDoc(doc.id, doc.data());
    if (row) rows.push(row);
  }
  return sortMembers(rows);
}

export async function nextSiteStaffOrder(
  db: Firestore,
  brand: SiteStaffBrand,
): Promise<number> {
  const all = await listSiteStaffMembers(db);
  const forBrand = all.filter((m) => m.brand === brand || m.brand === "both");
  if (forBrand.length === 0) return 0;
  return Math.max(...forBrand.map((m) => m.order)) + 10;
}

export async function listActiveSiteStaffForBrand(
  pageBrand: "paris" | "sulphur",
): Promise<SiteStaffDisplayMember[]> {
  const db = getFirestore();
  const snap = await db.collection(SITE_STAFF_COLLECTION).where("active", "==", true).get();
  const rows: SiteStaffMemberStored[] = [];
  for (const doc of snap.docs) {
    const row = parseSiteStaffDoc(doc.id, doc.data());
    if (row && memberMatchesBrand(row.brand, pageBrand)) rows.push(row);
  }
  return sortMembers(rows).map(storedToDisplay);
}

/** Active staff for a location page (Firestore only). */
export async function resolveSiteStaffForBrand(
  pageBrand: "paris" | "sulphur",
): Promise<SiteStaffDisplayMember[]> {
  return listActiveSiteStaffForBrand(pageBrand);
}

export function splitFeaturedAndGrid(members: SiteStaffDisplayMember[]): {
  featured: SiteStaffDisplayMember | null;
  grid: SiteStaffDisplayMember[];
} {
  const featuredRow = members.find((m) => m.featured) ?? members[0] ?? null;
  if (!featuredRow) return { featured: null, grid: [] };
  const grid = members.filter((m) => m.id !== featuredRow.id);
  return { featured: featuredRow, grid };
}
