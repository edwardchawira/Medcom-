import { redirect } from "next/navigation";

export default async function MedicationLearnStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  await params;
  redirect("/courses/ai-healthcare-learning-demo/learn/1");
}
