import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { courses } from "@/lib/siteData";
import { StaticCourseOverview } from "@/components/StaticCourseOverview";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  return {
    title: course ? `${course.title} | Overview | Medcom` : "Course overview | Medcom",
  };
}

export default async function StaticCourseOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = courses.find((c) => c.slug === slug);
  if (!course) return notFound();
  return <StaticCourseOverview course={course} startPath={course.startPath} />;
}
