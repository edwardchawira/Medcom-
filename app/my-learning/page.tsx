import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { courses, userProgress } from "@/lib/siteData";

export const metadata: Metadata = {
  title: "My Learning | Medcom",
};

export default function MyLearningPage() {
  const enrolledCourses = courses.map((course) => {
    const progressRow = userProgress.find((item) => item.course === course.title);
    const progress = progressRow?.progress ?? 0;

    return {
      ...course,
      progress,
      status: progressRow?.status ?? (progress >= 100 ? "Completed" : "In progress"),
    };
  });

  return (
    <>
      <SiteNav activeOverride="/my-learning" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">My Learning</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          {enrolledCourses.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                <Image
                  src={course.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  priority
                />
                <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm">
                  {course.category}
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{course.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {course.chapters} modules • {course.duration}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                      course.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>

                <div aria-label={`${course.progress}% complete`}>
                  <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>Progress</span>
                    <span>{course.progress}% complete</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#624596]"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={course.startPath}
                    className="inline-flex justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                  >
                    {course.progress > 0 ? "Resume learning" : "Start learning"}
                  </Link>
                  <Link
                    href={course.detailPath}
                    className="inline-flex justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
                  >
                    View course details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
