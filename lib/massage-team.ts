import { unstable_cache } from "next/cache";
import {
  MASSAGE_TEAM_CACHE_TAG,
  resolveMassageTeamCardsUncached,
} from "@/lib/massage-team-data";

export * from "@/lib/massage-team-data";

export const getMassageTeamForMarketing = unstable_cache(
  resolveMassageTeamCardsUncached,
  ["massage-team-marketing-v1"],
  { revalidate: 120, tags: [MASSAGE_TEAM_CACHE_TAG] },
);
