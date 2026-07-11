import type { JSX } from "react";
import Image from "next/image";
import type { LegacyBlock, LegacyImage } from "@/lib/legacy-pages";

/**
 * Renders legacy page content VERBATIM from the scraped `blocks[]` (tag + text),
 * exactly as published on the original site. Consecutive list items are grouped
 * into a single <ul>. Rescued images render below the copy, lazy-loaded.
 *
 * Text is passed through untouched — no rewriting, condensing, or grammar fixes.
 */

const HEADING_CLASS: Record<string, string> = {
  h1: "mt-8 text-3xl font-black text-[#4a1515] first:mt-0",
  h2: "mt-8 text-2xl font-black text-[#4a1515] first:mt-0",
  h3: "mt-6 text-xl font-bold text-[#4a1515] first:mt-0",
  h4: "mt-6 text-lg font-bold text-[#4a1515] first:mt-0",
  h5: "mt-4 text-base font-bold text-[#4a1515] first:mt-0",
  h6: "mt-4 text-sm font-bold uppercase tracking-wide text-[#4a1515] first:mt-0",
};

type RenderNode =
  | { kind: "heading"; tag: string; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; items: string[] };

/** Group a flat verbatim block list into renderable nodes (lists collapsed). */
function groupBlocks(blocks: LegacyBlock[]): RenderNode[] {
  const nodes: RenderNode[] = [];
  let listBuffer: string[] = [];
  const flushList = () => {
    if (listBuffer.length) {
      nodes.push({ kind: "list", items: listBuffer });
      listBuffer = [];
    }
  };
  for (const block of blocks) {
    const tag = (block.tag || "p").toLowerCase();
    const text = block.text ?? "";
    if (!text.trim()) continue;
    if (tag === "li") {
      listBuffer.push(text);
      continue;
    }
    flushList();
    if (tag.startsWith("h") && HEADING_CLASS[tag]) {
      nodes.push({ kind: "heading", tag, text });
    } else if (tag === "blockquote") {
      nodes.push({ kind: "quote", text });
    } else {
      nodes.push({ kind: "paragraph", text });
    }
  }
  flushList();
  return nodes;
}

export function LegacyPageBody({
  blocks,
  heroImage,
  images,
  accent = "#c0392b",
}: {
  blocks: LegacyBlock[];
  heroImage?: string;
  images?: LegacyImage[];
  accent?: string;
}) {
  const nodes = groupBlocks(blocks);
  const gallery = (images ?? []).filter((img) => img.url && img.url !== heroImage);

  return (
    <div className="space-y-4">
      {heroImage ? (
        <div className="relative mb-6 aspect-[16/9] w-full overflow-hidden rounded">
          <Image
            src={heroImage}
            alt={images?.find((i) => i.url === heroImage)?.alt || ""}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      ) : null}

      {nodes.map((node, i) => {
        if (node.kind === "heading") {
          const Tag = node.tag as keyof JSX.IntrinsicElements;
          return (
            <Tag key={i} className={HEADING_CLASS[node.tag]}>
              {node.text}
            </Tag>
          );
        }
        if (node.kind === "list") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-6 text-stone-700">
              {node.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        if (node.kind === "quote") {
          return (
            <blockquote
              key={i}
              className="border-l-4 pl-4 italic text-stone-700"
              style={{ borderColor: accent }}
            >
              {node.text}
            </blockquote>
          );
        }
        return (
          <p key={i} className="leading-relaxed text-stone-700">
            {node.text}
          </p>
        );
      })}

      {gallery.length ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {gallery.map((img, i) => (
            <figure key={i} className="overflow-hidden rounded border border-stone-200">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={img.url}
                  alt={img.alt || ""}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 384px"
                  className="object-cover"
                />
              </div>
              {img.caption ? (
                <figcaption className="px-3 py-2 text-sm text-stone-500">{img.caption}</figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}
