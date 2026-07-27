import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { courses } from "@/lib/siteData";
import { StaticCourseReader } from "@/components/StaticCourseReader";
import { DemoTrainingCourseReader } from "@/components/DemoTrainingCourseReader";
import { demoTrainingCourse } from "@/lib/demoTrainingCourse";

function validStep(step: string, chapterCount: number) {
  if (step === "assessment") return true;
  const n = parseInt(step, 10);
  return !Number.isNaN(n) && n >= 1 && n <= chapterCount;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) return { title: "Course | Medcom" };
  return { title: `${course.title} | Learn | Medcom` };
}

export default async function StaticLearnStepPage({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) return notFound();

  if (slug === demoTrainingCourse.slug) {
    const demoStepCount = demoTrainingCourse.lessons.length;
    if (!validStep(step, demoStepCount)) {
      redirect(`/courses/${slug}/learn/1`);
    }
    return <DemoTrainingCourseReader stepParam={step} />;
  }

  // Keep dynamic placeholder readers reasonable.
  const chapterCount = Math.max(6, Math.min(20, course.chapters || 10));
  if (!validStep(step, chapterCount)) {
    redirect(`/courses/${slug}/learn/1`);
  }

  return <StaticCourseReader course={course} stepParam={step} />;
}
