import { redirect } from "next/navigation";

export default async function StaticLearnIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/courses/${slug}/learn/1`);
}
