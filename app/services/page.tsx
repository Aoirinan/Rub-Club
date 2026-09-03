import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/page-metadata";
import { getPageMeta } from "@/lib/page-meta";
import { getContentMany } from "@/lib/cms";
import { parisText } from "@/lib/paris-pages-cms";
import { getUiText } from "@/lib/ui-text";
import Link from "next/link";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { WELLNESS_CARE_PLANS_PATH } from "@/lib/constants";
import {
  getPublicBookingConfig,
  scheduleCtaHref,
  scheduleCtaLabel,
} from "@/lib/public-booking-settings";
import { SERVICES_HUB_PATH } from "@/lib/service-breadcrumbs";
import { getServicesHubContent } from "@/lib/static-pages-content";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta("services", {
    title: "Services — Chiropractic & Massage in Paris & Sulphur Springs, TX",
    description:
      "Chiropractic care, wellness memberships, and therapeutic massage at Chiropractic Associates and The Rub Club in Paris and Sulphur Springs, TX.",
  });
  return buildPageMetadata({
    title: meta.title,
    description: meta.description,
    path: SERVICES_HUB_PATH,
  });
}

export default async function ServicesHubPage() {
  const [c, booking, copy, ui] = await Promise.all([
    getServicesHubContent(),
    getPublicBookingConfig(),
    getContentMany([
      "services_hub_wellness_link_label",
      "services_hub_book_chiro_label",
      "services_hub_book_massage_label",
    ]),
    getUiText(),
  ]);
  const t = (id: string) => parisText(copy, id);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Services", url: SERVICES_HUB_PATH },
        ]}
      />
      <PageHero eyebrow={c.heroEyebrow} title={c.heroTitle} lede={c.heroLede} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:grid-cols-2">
        <ServiceCard
          title={c.chiroTitle}
          body={c.chiroBody}
          href="/services/chiropractic"
          links={[
            { label: t("services_hub_wellness_link_label"), href: WELLNESS_CARE_PLANS_PATH },
            {
              label: scheduleCtaLabel(booking, t("services_hub_book_chiro_label")),
              href: scheduleCtaHref(booking, "service=chiropractic"),
            },
          ]}
          learnMoreLabel={ui.ui_learn_more}
        />
        <ServiceCard
          title={c.massageTitle}
          body={c.massageBody}
          href="/services/massage"
          links={[
            {
              label: scheduleCtaLabel(booking, t("services_hub_book_massage_label")),
              href: scheduleCtaHref(booking, "service=massage&location=paris"),
            },
          ]}
          learnMoreLabel={ui.ui_learn_more}
        />
      </div>
    </>
  );
}

function ServiceCard({
  title,
  body,
  href,
  links,
  learnMoreLabel,
}: {
  title: string;
  body: string;
  href: string;
  links: { label: string; href: string }[];
  learnMoreLabel: string;
}) {
  return (
    <section className="border-t-4 border-[#c0392b] bg-white p-6 shadow-md sm:p-8">
      <h2 className="text-xl font-black text-[#4a1515]">
        <Link href={href} className="hover:text-[#c0392b]">
          {title}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-stone-700">{body}</p>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm font-bold text-[#c0392b] underline hover:text-[#4a1515]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="focus-ring mt-6 inline-flex bg-[#4a1515] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-[#341010]"
      >
        {learnMoreLabel}
      </Link>
    </section>
  );
}
