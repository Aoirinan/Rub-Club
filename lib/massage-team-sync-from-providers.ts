import { FieldValue } from "firebase-admin/firestore";
import type { Firestore } from "firebase-admin/firestore";
import { IMAGES } from "@/lib/home-images";
import { TEAM } from "@/lib/home-verbatim";
import {
  listMassageTeamMembers,
  MASSAGE_TEAM_COLLECTION,
  type MassageTeamMemberStored,
} from "@/lib/massage-team-data";
import { massageTeamMemberMatchKey } from "@/lib/massage-team-provider-match";
import { compareProvidersForAssignment, fetchAllProviders } from "@/lib/providers-db";

const DEFAULT_BIO =
  "Licensed massage therapist at The Rub Club in Paris, TX. Bio can be edited here after import.";

export type SyncMassageTeamFromProvidersResult = {
  added: number;
  skipped: number;
  members: MassageTeamMemberStored[];
};

function builtinTeamByMatchKey(): Map<
  string,
  (typeof TEAM)[number]
> {
  const map = new Map<string, (typeof TEAM)[number]>();
  for (const member of TEAM) {
    const key = massageTeamMemberMatchKey(member.name);
    if (key) map.set(key, member);
  }
  return map;
}

function resolveHttpsPhotoUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();
  try {
    const u = new URL(s);
    if (u.protocol === "https:") return s;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Adds massage team rows for active bookable massage providers not already on the team (by name match).
 * Reuses built-in bios/portraits when names match the code defaults; otherwise provider about/photo or placeholders.
 */
export async function syncMassageTeamFromProviders(
  db: Firestore,
  updatedByUid: string,
): Promise<SyncMassageTeamFromProvidersResult> {
  const providers = (await fetchAllProviders(db)).filter(
    (p) => p.active && p.serviceLines.includes("massage"),
  );
  providers.sort(compareProvidersForAssignment);

  const existing = await listMassageTeamMembers(db);
  const existingKeys = new Set(existing.map((m) => massageTeamMemberMatchKey(m.name)));
  const builtinByKey = builtinTeamByMatchKey();
  const fallbackPhoto = IMAGES.massagePatient;

  let added = 0;
  let skipped = 0;

  for (const provider of providers) {
    const key = massageTeamMemberMatchKey(provider.displayName);
    if (!key || existingKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const builtin = builtinByKey.get(key);
    const bio =
      (provider.about?.trim() || builtin?.bio || DEFAULT_BIO).slice(0, 8000);
    const photoUrl =
      resolveHttpsPhotoUrl(provider.photoUrl) ??
      (builtin ? IMAGES[builtin.imageKey] : fallbackPhoto);
    const role = builtin && "role" in builtin ? builtin.role : undefined;

    const ref = db.collection(MASSAGE_TEAM_COLLECTION).doc();
    await ref.set({
      name: provider.displayName.trim(),
      bio,
      ...(role ? { role } : {}),
      photoUrl,
      sortOrder: provider.sortOrder,
      updatedAt: FieldValue.serverTimestamp(),
      updatedByUid,
    });
    existingKeys.add(key);
    added += 1;
  }

  const members = await listMassageTeamMembers(db);
  return { added, skipped, members };
}
