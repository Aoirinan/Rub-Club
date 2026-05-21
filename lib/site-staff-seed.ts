import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getContentMany } from "@/lib/cms";
import { parisStaffBioId, parisStaffNameId, parisStaffPhotoId, parisStaffRoleId } from "@/lib/paris-staff-cms-legacy-keys";
import { PARIS_STAFF_IMAGES } from "@/lib/paris-staff-images";
import { ssStaffBioId, ssStaffNameId, ssStaffPhotoId, ssStaffRoleId } from "@/lib/ss-staff-cms-legacy-keys";
import type { SiteStaffBrand } from "@/lib/site-staff-data";
import { SITE_STAFF_COLLECTION } from "@/lib/site-staff-data";
import { PARIS_OFFICE_STAFF_SEED, SS_STAFF_SEED } from "@/lib/site-staff-seed-rosters";

export type SiteStaffSeedRow = {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  brand: SiteStaffBrand;
  order: number;
  active: boolean;
  featured: boolean;
  specialties: string[];
};

function absolutePhotoUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** CMS keys for per-member overrides (legacy Site content fields). */
function allLegacyStaffCmsIds(): string[] {
  const paris = PARIS_OFFICE_STAFF_SEED.flatMap((m) => [
    parisStaffNameId(m.id),
    parisStaffRoleId(m.id),
    parisStaffBioId(m.id),
    parisStaffPhotoId(m.id),
  ]);
  const ss = SS_STAFF_SEED.flatMap((m) => [
    ssStaffNameId(m.id),
    ssStaffRoleId(m.id),
    ssStaffBioId(m.id),
    ssStaffPhotoId(m.id),
  ]);
  return [...paris, ...ss];
}

export async function buildSiteStaffSeedRows(): Promise<SiteStaffSeedRow[]> {
  const cms = await getContentMany(allLegacyStaffCmsIds());
  const rows: SiteStaffSeedRow[] = [];

  PARIS_OFFICE_STAFF_SEED.forEach((member, index) => {
    const name = cms[parisStaffNameId(member.id)]?.trim() || member.name;
    const title = cms[parisStaffRoleId(member.id)]?.trim() || member.role;
    const bio = cms[parisStaffBioId(member.id)]?.trim() ?? member.bio;
    const photo =
      cms[parisStaffPhotoId(member.id)]?.trim() || PARIS_STAFF_IMAGES[member.imageKey] || "";
    rows.push({
      name,
      title,
      bio,
      photoUrl: absolutePhotoUrl(photo),
      brand: "paris",
      order: index * 10,
      active: true,
      featured: false,
      specialties: [],
    });
  });

  SS_STAFF_SEED.forEach((member, index) => {
    const name = cms[ssStaffNameId(member.id)]?.trim() || member.name;
    const title = cms[ssStaffRoleId(member.id)]?.trim() || member.role;
    const bio = cms[ssStaffBioId(member.id)]?.trim() ?? member.bio;
    const photo = cms[ssStaffPhotoId(member.id)]?.trim() || member.image || "";
    rows.push({
      name,
      title,
      bio,
      photoUrl: absolutePhotoUrl(photo),
      brand: "sulphur",
      order: index * 10,
      active: true,
      featured: member.id === "dr_conner_collins",
      specialties: [],
    });
  });

  return rows;
}

export async function seedSiteStaffCollection(
  db: Firestore,
  updatedByUid: string,
): Promise<{ count: number }> {
  const existing = await db.collection(SITE_STAFF_COLLECTION).limit(1).get();
  if (!existing.empty) {
    throw new Error("SITE_STAFF_ALREADY_SEEDED");
  }
  const rows = await buildSiteStaffSeedRows();
  const batch = db.batch();
  for (const row of rows) {
    const ref = db.collection(SITE_STAFF_COLLECTION).doc();
    batch.set(ref, {
      name: row.name,
      title: row.title,
      bio: row.bio,
      photoUrl: row.photoUrl,
      specialties: row.specialties,
      brand: row.brand,
      order: row.order,
      active: row.active,
      featured: row.featured,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid,
    });
  }
  await batch.commit();
  return { count: rows.length };
}
