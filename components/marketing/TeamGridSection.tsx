import type { MassageTeamCard } from "@/lib/massage-team";
import { MassageTeamGrid } from "./MassageTeamGrid";

type Props = {
  members: MassageTeamCard[];
  titleAs?: "h1" | "h2";
};

export function TeamGridSection({ members, titleAs = "h2" }: Props) {
  return (
    <MassageTeamGrid
      members={members}
      title="Meet the Team"
      subtitle="Massage therapy — The Rub Club"
      titleAs={titleAs}
      variant="home"
    />
  );
}
