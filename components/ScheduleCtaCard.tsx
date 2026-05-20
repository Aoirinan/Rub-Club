import { CtaCard } from "@/components/PageChrome";
import {
  getPublicBookingConfig,
  scheduleCtaHref,
  scheduleCtaLabel,
} from "@/lib/public-booking-settings";

type Props = {
  title: string;
  body?: string;
  bookLabel?: string;
  contactLabel?: string;
  query?: string;
  secondary?: { label: string; href: string };
};

/** Bottom CTA that respects online-booking on/off (phase 1 → Contact us). */
export async function ScheduleCtaCard({
  title,
  body,
  bookLabel = "Book online",
  contactLabel = "Contact us",
  query = "",
  secondary,
}: Props) {
  const booking = await getPublicBookingConfig();
  return (
    <CtaCard
      title={title}
      body={body}
      primary={{
        label: scheduleCtaLabel(booking, bookLabel, contactLabel),
        href: scheduleCtaHref(booking, query),
      }}
      secondary={secondary}
    />
  );
}
