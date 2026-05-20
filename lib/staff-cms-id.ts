/** Stable CMS key segment from a roster id (e.g. `brandi_boren`). */
export function staffCmsSlug(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
