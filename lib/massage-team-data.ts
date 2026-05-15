import type { DocumentData, Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import { IMAGES } from "@/lib/home-images";
import { TEAM } from "@/lib/home-verbatim";

export const MASSAGE_TEAM_COLLECTION = "massage_team_members";
export const MASSAGE_TEAM_CACHE_TAG = "massage-team-public";

export type MassageTeamCard = {
  id: string;
  name: string;
  bio: string;
  role?: string;
  imageSrc: string;
};

export type MassageTeamMemberStored = {
  id: string;
  name: string;
  bio: string;
  role?: string;
  photoUrl: string;
  photoStoragePath?: string;
  sortOrder: number;
};

export function defaultMassageTeamCards(): MassageTeamCard[] {
  return TEAM.map((member) => ({
    id: `default:${member.name}`,
    name: member.name,
    bio: member.bio,
    ...("role" in member && member.role ? { role: member.role } : {}),
    imageSrc: IMAGES[member.imageKey],
  }));
}

export function parseMassageTeamDoc(
  id: string,
  data: DocumentData | undefined,
): MassageTeamMemberStored | null {
  if (!data) return null;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const bio = typeof data.bio === "string" ? data.bio.trim() : "";
  const photoUrl = typeof data.photoUrl === "string" ? data.photoUrl.trim() : "";
  if (!name || !bio || !photoUrl) return null;
  const roleRaw = typeof data.role === "string" ? data.role.trim() : "";
  const sortOrder =
    typeof data.sortOrder === "number" && Number.isFinite(data.sortOrder) ? data.sortOrder : 0;
  const photoStoragePath =
    typeof data.photoStoragePath === "string" && data.photoStoragePath.trim()
      ? data.photoStoragePath.trim()
      : undefined;
  return {
    id,
    name,
    bio,
    ...(roleRaw ? { role: roleRaw } : {}),
    photoUrl,
    ...(photoStoragePath ? { photoStoragePath } : {}),
    sortOrder,
  };
}

export async function listMassageTeamMembers(db: Firestore): Promise<MassageTeamMemberStored[]> {
  const snap = await db.collection(MASSAGE_TEAM_COLLECTION).get();
  const rows: MassageTeamMemberStored[] = [];
  for (const doc of snap.docs) {
    const row = parseMassageTeamDoc(doc.id, doc.data());
    if (row) rows.push(row);
  }
  rows.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  });
  return rows;
}

/** Next default sortOrder: 0 when the collection is empty; otherwise max existing + 10 (matches prior orderBy-based behavior). */
export async function nextMassageTeamSortOrder(db: Firestore): Promise<number> {
  const snap = await db.collection(MASSAGE_TEAM_COLLECTION).get();
  if (snap.empty) return 0;
  let max = 0;
  let anyParsed = false;
  for (const doc of snap.docs) {
    const row = parseMassageTeamDoc(doc.id, doc.data());
    if (row) {
      anyParsed = true;
      if (row.sortOrder > max) max = row.sortOrder;
    }
  }
  return anyParsed ? max + 10 : 0;
}

function storedToCard(row: MassageTeamMemberStored): MassageTeamCard {
  return {
    id: row.id,
    name: row.name,
    bio: row.bio,
    ...(row.role ? { role: row.role } : {}),
    imageSrc: row.photoUrl,
  };
}

/** Uncached resolution used by `getMassageTeamForMarketing` and offline verification. */
export async function resolveMassageTeamCardsUncached(): Promise<MassageTeamCard[]> {
  try {
    const db = getFirestore();
    const rows = await listMassageTeamMembers(db);
    if (rows.length > 0) {
      return rows.map(storedToCard);
    }
  } catch {
    /* fall through to defaults */
  }
  return defaultMassageTeamCards();
}
