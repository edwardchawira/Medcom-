"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { demoTrainingCourse } from "@/lib/demoTrainingCourse";
import type { Course } from "@/lib/siteData";

type AccordionRow = { title: string; body: string };

export function StaticCourseOverview({
  course,
  startPath,
}: {
  course: Course;
  startPath: string;
}) {
  const suitableFor = useMemo(() => course.audience.join(", "), [course.audience]);
  const certPrice = "£10.79";
  const learningPrice = "Free";
  const durationLabel = course.duration.replace("-", "–");
  const isDemoSafeguardingCourse = course.slug === demoTrainingCourse.slug;

  const curriculum = useMemo(
    () => {
      if (isDemoSafeguardingCourse) {
        return demoTrainingCourse.lessons.map((lesson, idx) => ({
          key: String(idx + 1).padStart(2, "0"),
          title: lesson.title,
          body:
            lesson.objectives.length > 0
              ? lesson.objectives.join(" ")
              : "Interactive safeguarding guidance, learner checks, and practical examples.",
          meta: `${lesson.minutes} min • ${lesson.kind}`,
        }));
      }

      return Array.from({ length: Math.min(12, course.chapters) }).map((_, idx) => ({
        key: String(idx + 1).padStart(2, "0"),
        title: `Chapter ${idx + 1}`,
        body: "Short interactive content, quick checks, and practical guidance.",
        meta: null,
      }));
    },
    [course.chapters, isDemoSafeguardingCourse]
  );

  const outcomes = useMemo(
    () =>
      isDemoSafeguardingCourse
        ? demoTrainingCourse.learningOutcomes
        : [
            `Understand key concepts in ${course.title}.`,
            "Recognise common risks and when to escalate concerns.",
            "Apply practical guidance in day-to-day care.",
            "Communicate observations clearly to the wider team.",
          ],
    [course.title, isDemoSafeguardingCourse]
  );

  const faqs: AccordionRow[] = useMemo(
    () => [
      {
        title: "Do I need to pay to start learning?",
        body: "No. Learning on Medcom is free. Certificates can be purchased after completing the course.",
      },
      {
        title: "How do certificates work?",
        body: "Once you complete the module, you can download a pass certificate. Certificates are free for active Medcom workers.",
      },
      {
        title: "Can I pause and come back later?",
        body: "Yes — you can leave at any time and resume where you left off.",
      },
    ],
    []
  );

  const [openCurriculum, setOpenCurriculum] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SiteNav activeOverride="/courses" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-teal-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/courses" className="hover:text-teal-600">
            Courses
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">{course.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-6 lg:gap-10 items-start">
          <section className="min-w-0">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
                <i className="fas fa-sparkles text-[11px]" aria-hidden />
                Industry-backed eLearning
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {course.title}
              </h1>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm">
                  <i className="fas fa-certificate text-teal-700" aria-hidden />
                  CPD Accredited
                </div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                  <i className="fas fa-award text-slate-500" aria-hidden />
                  Skills for Care
                </div>
              </div>
            </div>

            <div className="card overflow-hidden mb-8">
              <div className="relative aspect-[16/9] w-full bg-slate-100">
                <Image
                  src={course.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 760px"
                  priority
                  unoptimized
                />
              </div>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">
                  Learning outcomes
                </h2>
                <div className="card p-5 sm:p-6">
                  <ol className="space-y-3">
                    {outcomes.map((text, idx) => (
                      <li key={idx} className="flex gap-3 text-sm sm:text-[15px] leading-relaxed">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700">{text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">Course curriculum</h2>
                <div className="card overflow-hidden">
                  {curriculum.map((row, idx) => {
                    const isOpen = openCurriculum === idx;
                    return (
                      <button
                        key={row.key}
                        type="button"
                        onClick={() => setOpenCurriculum(isOpen ? null : idx)}
                        className="w-full text-left border-b border-slate-200 last:border-b-0 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 text-xs font-bold">
                            {row.key}
                          </span>
                          <span className="flex-1 text-sm font-semibold text-slate-900">
                            {row.title}
                          </span>
                          {row.meta ? (
                            <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 sm:inline-flex">
                              {row.meta}
                            </span>
                          ) : null}
                          <i
                            className={`fas fa-chevron-down text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </div>
                        <div
                          className={`px-4 sm:px-5 pb-4 text-sm text-slate-600 grid transition-[grid-template-rows] duration-200 ${
                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="leading-relaxed">{row.body}</p>
                            {row.meta ? (
                              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-teal-700 sm:hidden">
                                {row.meta}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">FAQ</h2>
                <div className="card overflow-hidden">
                  {faqs.map((row, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <button
                        key={row.title}
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="w-full text-left border-b border-slate-200 last:border-b-0 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 px-4 sm:px-5 py-4">
                          <span className="flex-1 text-sm font-semibold text-slate-900">
                            {row.title}
                          </span>
                          <i
                            className={`fas fa-chevron-down text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </div>
                        <div
                          className={`px-4 sm:px-5 pb-4 text-sm text-slate-600 grid transition-[grid-template-rows] duration-200 ${
                            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden leading-relaxed">{row.body}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="card p-5 sm:p-6">
              <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={course.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 380px"
                  unoptimized
                />
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{course.title}</h3>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <i className="fas fa-tag mt-0.5 text-teal-700" aria-hidden />
                  <div className="text-slate-700">
                    <div className="font-semibold text-slate-900">Suitable for</div>
                    <div className="text-slate-600">{suitableFor}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-clock mt-0.5 text-teal-700" aria-hidden />
                  <div className="text-slate-700">
                    <div className="font-semibold text-slate-900">Course length</div>
                    <div className="text-slate-600">{durationLabel} minutes</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-coins mt-0.5 text-teal-700" aria-hidden />
                  <div className="text-slate-700">
                    <div className="font-semibold text-slate-900">Cost</div>
                    <div className="text-slate-600">
                      {learningPrice} <span className="text-slate-500">(inc. VAT)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="fas fa-certificate mt-0.5 text-teal-700" aria-hidden />
                  <div className="text-slate-700">
                    <div className="font-semibold text-slate-900">Certificate</div>
                    <div className="text-slate-600">
                      {certPrice} <span className="text-slate-500">(inc. VAT)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-teal-800">
                <span>Certificates are free for active Medcom workers</span>
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                  title="If you’re an active Medcom worker, certificate download is included."
                  aria-label="Certificate info"
                >
                  <i className="fas fa-info text-[10px]" aria-hidden />
                </span>
              </div>

              <div className="mt-5">
                <Link
                  href={startPath}
                  className="btn-teal inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 no-underline"
                >
                  Start learning
                </Link>
                <p className="mt-2 text-center text-xs text-slate-500">
                  No payment required to start
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
