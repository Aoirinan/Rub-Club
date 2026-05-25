import Image from "next/image";
import { renderRichText } from "@/lib/cms";
import type { VisualLayer, VisualPageLayout } from "@/lib/visual-page-layout";

type Props = {
  layout: VisualPageLayout;
  cms: Record<string, string>;
  renderEmbed?: (layer: VisualLayer) => React.ReactNode;
  className?: string;
};

export function VisualPageRenderer({ layout, cms, renderEmbed, className = "" }: Props) {
  const visible = [...layout.layers]
    .filter((l) => !l.hidden)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className={`relative w-full ${className}`}
      style={{ minHeight: layout.frameHeight }}
    >
      {visible.map((layer) => (
        <div
          key={layer.id}
          className="absolute overflow-hidden"
          style={{
            left: `${layer.box.x}%`,
            top: `${layer.box.y}%`,
            width: `${layer.box.w}%`,
            height: `${layer.box.h}%`,
            zIndex: layer.zIndex,
          }}
        >
          <VisualLayerPublic layer={layer} cms={cms} renderEmbed={renderEmbed} />
        </div>
      ))}
    </div>
  );
}

function VisualLayerPublic({
  layer,
  cms,
  renderEmbed,
}: {
  layer: VisualLayer;
  cms: Record<string, string>;
  renderEmbed?: (layer: VisualLayer) => React.ReactNode;
}) {
  if (layer.type === "embed" && renderEmbed) {
    const node = renderEmbed(layer);
    if (node) return <div className="h-full w-full">{node}</div>;
  }

  if (layer.type === "image") {
    const src = layer.src ?? (layer.cmsFieldId ? cms[layer.cmsFieldId] : "");
    if (!src) return null;
    return (
      <div className="relative h-full w-full">
        <Image
          src={src}
          alt={layer.alt ?? ""}
          fill
          className="object-contain object-left"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={src.startsWith("http")}
        />
      </div>
    );
  }

  if (layer.type === "richtext") {
    const raw = layer.content ?? (layer.cmsFieldId ? cms[layer.cmsFieldId] : "");
    if (!raw) return null;
    return (
      <div
        className="h-full overflow-auto text-sm leading-relaxed text-stone-700"
        dangerouslySetInnerHTML={{ __html: renderRichText(raw) }}
      />
    );
  }

  if (layer.type === "text") {
    const raw = layer.content ?? (layer.cmsFieldId ? cms[layer.cmsFieldId] : "");
    if (!raw) return null;
    return (
      <p className="h-full overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
        {raw}
      </p>
    );
  }

  return null;
}
