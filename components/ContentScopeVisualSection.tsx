import { VisualPageRenderer } from "@/components/VisualPageRenderer";
import { getContentMany } from "@/lib/cms";
import { contentScopeDef, type ContentScopeId } from "@/lib/page-builder-content-scopes";
import { getScopeVisualLayout } from "@/lib/cms-display";
import type { VisualPageLayout } from "@/lib/visual-page-layout";

/** Optional visual layer block for site-copy scopes (footer tagline, home hero fields, etc.). */
export async function ContentScopeVisualSection({
  scopeId,
  className = "",
}: {
  scopeId: ContentScopeId;
  className?: string;
}) {
  const visual = await getScopeVisualLayout(scopeId);
  if (!visual) return null;

  const def = contentScopeDef(scopeId);
  const fieldIds = def.sections.flatMap((s) => s.fieldIds);
  const cms = await getContentMany(fieldIds);

  const cmsOnly = visual.layers.filter(
    (l) => !l.hidden && (l.cmsFieldId || l.type === "text" || l.type === "image" || l.type === "richtext"),
  );
  if (cmsOnly.length === 0) return null;

  const trimmed: VisualPageLayout = {
    ...visual,
    layers: cmsOnly,
  };

  return (
    <section className={className} aria-label={`${def.label} visual content`}>
      <VisualPageRenderer layout={trimmed} cms={cms as Record<string, string>} />
    </section>
  );
}
