import Image from "next/image";
import Link from "next/link";
import { ChiroTreatmentIcon } from "@/components/ChiroTreatmentIcon";
import type {
  PracticeServiceCard,
  PracticeServicesGridSection,
} from "@/lib/practice-pages-shared";

function CardBody({ card }: { card: PracticeServiceCard }) {
  const remote = /^https?:\/\//i.test(card.imageUrl);
  return (
    <>
      {card.imageUrl.trim() ? (
        <div className="relative -mx-5 -mt-5 mb-4 aspect-[3/2] overflow-hidden bg-stone-100">
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
        <div className="text-[var(--pp-accent)]">
          <ChiroTreatmentIcon name={card.name} />
        </div>
      )}
      <h3 className="mt-3 text-base font-black text-[var(--pp-heading)] group-hover:text-[var(--pp-accent)]">
        {card.name}
      </h3>
      {card.blurb.trim() ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">{card.blurb}</p>
      ) : null}
      {card.href.trim() ? (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-[var(--pp-accent)]">
          Read More <span aria-hidden>&rarr;</span>
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
    <section className="border-t-4 border-[var(--pp-accent)] bg-white p-6 shadow-md sm:p-10">
      {data.heading.trim() ? (
        <h2 className="text-2xl font-black text-[var(--pp-heading)]">{data.heading}</h2>
      ) : null}
      {data.intro.trim() ? (
        <p className="mt-3 max-w-3xl leading-relaxed text-stone-700">{data.intro}</p>
      ) : null}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, idx) =>
          card.href.trim() ? (
            <Link
              key={`${idx}-${card.name}`}
              href={card.href}
              className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-[var(--pp-accent)] hover:shadow-md"
            >
              <CardBody card={card} />
            </Link>
          ) : (
            <div
              key={`${idx}-${card.name}`}
              className="flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white p-5 shadow-sm"
            >
              <CardBody card={card} />
            </div>
          ),
        )}
      </div>
    </section>
  );
}
