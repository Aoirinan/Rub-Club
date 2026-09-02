import { VisualPageRenderer } from "@/components/VisualPageRenderer";
import { HERO_BLOCK_ID } from "@/lib/page-builder-cms";
import { blockOrderFromVisual } from "@/lib/visual-page-migrations";
import type { VisualLayer, VisualPageLayout } from "@/lib/visual-page-layout";
import type { PageLayoutId } from "@/lib/page-layout";
import { getPageBlockOrder } from "@/lib/page-layout-db";

type Props = {
  pageId: PageLayoutId;
  visual: VisualPageLayout;
  cms: Record<string, string>;
  renderBlock: (blockId: string) => React.ReactNode;
};

export async function ServicePageVisualSection({
  pageId,
  visual,
  cms,
  renderBlock,
}: Props) {
  const blockOrder = blockOrderFromVisual(visual, pageId);
  const hasEmbedLayers = visual.layers.some(
    (l) => l.type === "embed" && l.blockId && l.blockId !== HERO_BLOCK_ID,
  );
  // The stored page layout is only the fallback when the visual layout has no
  // embed layers; an all-hidden visual layout must render no blocks.
  const order = hasEmbedLayers ? blockOrder : await getPageBlockOrder(pageId);

  const embedLayers = visual.layers.filter(
    (l) =>
      l.type === "embed" &&
      l.blockId &&
      l.blockId !== HERO_BLOCK_ID &&
      !l.hidden &&
      order.includes(l.blockId),
  );

  const hasPositionedBlocks = embedLayers.some((l) => l.box.w < 96);

  if (!hasPositionedBlocks) {
    return (
      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-16">
        {order.map((id) => (
          <div key={id}>{renderBlock(id)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <VisualPageRenderer
        layout={visual}
        cms={cms}
        className="w-full"
        renderEmbed={(layer: VisualLayer) => {
          if (!layer.blockId || layer.blockId === HERO_BLOCK_ID) return null;
          if (!order.includes(layer.blockId)) return null;
          return renderBlock(layer.blockId);
        }}
      />
    </div>
  );
}
