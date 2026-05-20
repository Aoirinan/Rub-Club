import type { Firestore } from "firebase-admin/firestore";
import {
  listMassageTeamMembers,
  MASSAGE_TEAM_COLLECTION,
  parseMassageTeamDoc,
} from "@/lib/massage-team-data";
import { compareProvidersForAssignment, fetchAllProviders, parseProviderDoc } from "@/lib/providers-db";

export type MassageTherapistOption = { id: string; name: string };

/** Where testimonial-video therapist options came from (team page vs bookable providers). */
export type MassageTherapistListSource = "team" | "providers";

/**
 * Options for tagging testimonial videos to a therapist.
 * Prefers Firestore `massage_team_members`; if empty, uses active bookable massage providers.
 */
export async function listMassageTherapistsForOwnerMarketing(
  db: Firestore,
): Promise<{ members: MassageTherapistOption[]; source: MassageTherapistListSource | null }> {
  const teamRows = await listMassageTeamMembers(db);
  if (teamRows.length > 0) {
    return {
      members: teamRows.map((m) => ({ id: m.id, name: m.name })),
      source: "team",
    };
  }

  const providers = (await fetchAllProviders(db)).filter(
    (p) => p.active && p.serviceLines.includes("massage"),
  );
  providers.sort(compareProvidersForAssignment);
  if (providers.length === 0) {
    return { members: [], source: null };
  }

  return {
    members: providers.map((p) => ({ id: p.id, name: p.displayName })),
    source: "providers",
  };
}

/** True if id is a massage team member or an active bookable massage provider. */
export async function massageTherapistIdExists(db: Firestore, id: string): Promise<boolean> {
  const trimmed = id.trim();
  if (!trimmed) return false;

  const teamSnap = await db.collection(MASSAGE_TEAM_COLLECTION).doc(trimmed).get();
  if (teamSnap.exists) {
    const row = parseMassageTeamDoc(trimmed, teamSnap.data());
    if (row) return true;
  }

  const providerSnap = await db.collection("providers").doc(trimmed).get();
  if (!providerSnap.exists) return false;
  const provider = parseProviderDoc(trimmed, providerSnap.data()!);
  return Boolean(provider?.active && provider.serviceLines.includes("massage"));
}
