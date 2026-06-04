import { buildPageMetadata } from "@/lib/page-metadata";
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

export const metadata = buildPageMetadata({
  title: "Services — Chiropractic & Massage in Paris & Sulphur Springs, TX",
  description:
    "Chiropractic care, wellness memberships, and therapeutic massage at Chiropractic Associates and The Rub Club in Paris and Sulphur Springs, TX.",
  path: SERVICES_HUB_PATH,
});

export default async function ServicesHubPage() {
  const [c, booking] = await Promise.all([getServicesHubContent(), getPublicBookingConfig()]);

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
            { label: "Wellness care plans (Paris)", href: WELLNESS_CARE_PLANS_PATH },
            {
              label: scheduleCtaLabel(booking, "Book chiropractic online"),
              href: scheduleCtaHref(booking, "service=chiropractic"),
            },
          ]}
        />
        <ServiceCard
          title={c.massageTitle}
          body={c.massageBody}
          href="/services/massage"
          links={[
            {
              label: scheduleCtaLabel(booking, "Book massage online"),
              href: scheduleCtaHref(booking, "service=massage&location=paris"),
            },
          ]}
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
}: {
  title: string;
  body: string;
  href: string;
  links: { label: string; href: string }[];
}) {
  return (
    <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-8">
      <h2 className="text-xl font-black text-[#173f3b]">
        <Link href={href} className="hover:text-[#0f5f5c]">
          {title}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-stone-700">{body}</p>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm font-bold text-[#0f5f5c] underline hover:text-[#173f3b]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="focus-ring mt-6 inline-flex bg-[#0f5f5c] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white hover:bg-[#0f817b]"
      >
        Learn more
      </Link>
    </section>
  );
}
