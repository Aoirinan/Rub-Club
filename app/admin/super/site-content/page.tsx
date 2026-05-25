import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ field?: string; section?: string; scope?: string; page?: string }>;
};

/** Site content editing moved to the website editor (page builder). */
export default async function SiteContentPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.scope) q.set("scope", params.scope);
  else if (params.page) q.set("page", params.page);
  else q.set("scope", "home");
  if (params.field) q.set("field", params.field);
  if (params.section) q.set("section", params.section);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  redirect(`/admin/super/page-builder${suffix}`);
}
