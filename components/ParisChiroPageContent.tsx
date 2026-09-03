import Image from "next/image";
import { SsMarkdownBody } from "@/components/SsMarkdownBody";

type Props = {
  body: string;
  heroImage?: string;
  galleryImages?: string[];
  /** Screen-reader description for the hero logo and gallery photos. */
  imageAlt?: string;
};

function PageImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const remote = src.startsWith("http");
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      className={className ?? "h-auto w-full max-w-[373px]"}
      sizes="(max-width: 640px) 100vw, 373px"
      unoptimized={remote}
    />
  );
}

/** Paris chiro detail page body with optional hero logo and gallery row. */
export function ParisChiroPageContent({ body, heroImage, galleryImages, imageAlt }: Props) {
  const alt = imageAlt?.trim() || "Stretch & Flex Rehab";
  const hero = heroImage?.trim() ?? "";
  const gallery = (galleryImages ?? []).map((u) => u.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      {hero ? (
        <div className="flex justify-center">
          <PageImage src={hero} alt={alt} />
        </div>
      ) : null}
      <SsMarkdownBody body={body} centeredH2Titles={["WHY STRETCH?"]} />
      {gallery.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          {gallery.map((src, i) => (
            <PageImage
              key={`${src}-${i}`}
              src={src}
              alt={alt}
              className="h-auto w-auto max-w-[258px]"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
