import Image from "next/image";
import Link from "next/link";
import { ChiroTreatmentIcon } from "@/components/ChiroTreatmentIcon";
import { SectionHeading } from "@/components/practice/SectionHeading";
import type {
  PracticeServiceCard,
  PracticeServicesGridSection,
} from "@/lib/practice-pages-shared";

function CardBody({ card }: { card: PracticeServiceCard }) {
  const remote = /^https?:\/\//i.test(card.imageUrl);
  return (
    <>
      {card.imageUrl.trim() ? (
        <div className="relative mb-5 aspect-[3/2] w-full overflow-hidden rounded-lg bg-stone-100">
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={remote}
          />
        </div>
      ) : (
        <div className="mx-auto text-[var(--pp-accent)]">
          <ChiroTreatmentIcon name={card.name} />
        </div>
      )}
      <h3 className="text-xl font-semibold text-stone-800 group-hover:text-[var(--pp-accent)] sm:text-2xl">
        {card.name}
      </h3>
      {card.blurb.trim() ? (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-stone-500">{card.blurb}</p>
      ) : null}
      {card.href.trim() ? (
        <span className="mx-auto mt-5 inline-flex bg-[var(--pp-cta)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition group-hover:bg-[var(--pp-cta-hover)]">
          Read More
        </span>
      ) : null}
    </>
  );
}

/** Grid of service cards: image (or icon) + name + blurb + Read More. */
export function ServicesGrid({
  data,
  derivedCards,
}: {
  data: PracticeServicesGridSection;
  /** Cards resolved by the page for "ss-services" mode. */
  derivedCards?: PracticeServiceCard[];
}) {
  if (!data.published) return null;
  const cards = (data.mode === "ss-services" ? (derivedCards ?? []) : data.cards).filter(
    (card) => card.name.trim().length > 0,
  );
  if (cards.length === 0) return null;

  return (
    <section className="py-4">
      {data.heading.trim() ? <SectionHeading>{data.heading}</SectionHeading> : null}
      {data.intro.trim() ? (
        <p className="mx-auto mt-5 max-w-3xl text-center leading-relaxed text-stone-500">
          {data.intro}
        </p>
      ) : null}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) =>
          card.href.trim() ? (
            <Link
              key={`${idx}-${card.name}`}
              href={card.href}
              className="group flex flex-col overflow-hidden rounded-xl bg-white p-5 text-center shadow-md transition hover:shadow-lg"
            >
              <CardBody card={card} />
            </Link>
          ) : (
            <div
              key={`${idx}-${card.name}`}
              className="group flex flex-col overflow-hidden rounded-xl bg-white p-5 text-center shadow-md"
            >
              <CardBody card={card} />
            </div>
          ),
        )}
      </div>
    </section>
  );
}
