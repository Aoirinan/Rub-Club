import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageHero } from "@/components/PageChrome";
import { ScheduleCtaCard } from "@/components/ScheduleCtaCard";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";
import { telHref } from "@/lib/constants";
import { allSSPageSlugs, getSSPageContent } from "@/lib/ss-cms-content";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allSSPageSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSSPageContent(slug);
  if (!page) return { title: "Sulphur Springs" };

  return {
    title: `${page.title} — Sulphur Springs Chiropractic`,
    description: page.metaDescription,
    alternates: { canonical: `/sulphur-springs/${page.slug}` },
    openGraph: {
      title: `${page.title} — Sulphur Springs, TX`,
      description: page.metaDescription,
      url: `/sulphur-springs/${page.slug}`,
    },
  };
}

export default async function SulphurSpringsSubpage({ params }: Props) {
  const { slug } = await params;
  const page = await getSSPageContent(slug);
  if (!page) notFound();

  const ctaTitle = page.kind === "injury" ? "Need treatment?" : "Schedule an appointment";
  const ctaBody =
    page.kind === "injury"
      ? "Contact our Sulphur Springs office for a thorough examination."
      : "Contact our Sulphur Springs office to discuss whether this treatment is right for you.";

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", url: "/" },
          { name: "Sulphur Springs", url: "/sulphur-springs" },
          { name: page.title, url: `/sulphur-springs/${page.slug}` },
        ]}
      />
      <PageHero eyebrow="Chiropractic Associates · Sulphur Springs" title={page.title} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-16">
        <section className="border-t-4 border-[#0f5f5c] bg-white p-6 shadow-md sm:p-10">
          <div className="prose prose-stone max-w-none">
            <SsMarkdownBody body={page.body} />
          </div>
        </section>
        <ScheduleCtaCard
          title={ctaTitle}
          body={ctaBody}
          secondary={{ label: "Call 903-919-5020", href: telHref("903-919-5020") }}
        />
      </div>
    </>
  );
}
