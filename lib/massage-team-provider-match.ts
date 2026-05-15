import type { MassageTeamCard } from "@/lib/massage-team";

/**
 * Stable key for matching a bookable provider display name to a public "Meet the team" card.
 * Drops single-letter tokens so "Brandi L. Boren" matches "Brandi Boren".
 */
export function massageTeamMemberMatchKey(name: string): string {
  const parts = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1);
  parts.sort();
  return parts.join(" ");
}

/** First card wins when two members normalize to the same key (unexpected). */
export function massageTeamPhotoByMatchKey(team: MassageTeamCard[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const m of team) {
    const key = massageTeamMemberMatchKey(m.name);
    if (!key) continue;
    if (!m.imageSrc.startsWith("https:")) continue;
    if (map.has(key)) continue;
    map.set(key, m.imageSrc);
  }
  return map;
}
