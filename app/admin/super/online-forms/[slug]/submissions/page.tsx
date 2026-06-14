import { SubmissionsBrowser } from "@/components/admin/online-forms/SubmissionsBrowser";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SubmissionsBrowser slug={slug} />;
}
