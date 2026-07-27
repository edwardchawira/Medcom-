"use client";

import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { useMe } from "@/lib/auth/useMe";
import { useDashboard } from "@/lib/dashboard/useDashboard";

export default function HomePage() {
  const { data } = useMe();
  const name = data && "user" in data && data.user ? data.user.fullName : "there";
  const dash = useDashboard();
  const dashName = dash.data?.user?.fullName;
  const displayName = dashName || name;
  const certificatesCount = dash.data?.certificatesCount ?? 0;
  const continueCourse = dash.data?.continueCourse ?? null;
  const recent = dash.data?.recentActivity ?? [];

  return (
    <>
      <SiteNav activeOverride="/" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section
          className="relative mb-10 overflow-hidden rounded-2xl border border-teal-100/90 bg-gradient-to-br from-teal-50/95 via-white to-slate-50 shadow-sm ring-1 ring-black/[0.03]"
          aria-labelledby="home-hero-heading"
        >
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-10 lg:p-10">
            <div className="order-2 flex flex-col justify-center lg:order-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Medcom Academy
              </p>
              <h1
                id="home-hero-heading"
                className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Welcome back, {name}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Pick up compliance training, build skills for home care, and keep certificates ready.
                All in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/courses"
                  className="btn-teal inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:opacity-95 no-underline"
                >
                  <i className="fas fa-book-open mr-2 text-sm opacity-95" aria-hidden />
                  Browse courses
                </Link>
                <Link
                  href="/my-learning"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-teal-600 bg-white/80 px-5 py-2.5 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 no-underline"
                >
                  <i className="fas fa-graduation-cap mr-2 text-sm" aria-hidden />
                  My learning
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[1200/450] w-full overflow-hidden rounded-xl border border-teal-100/80 bg-teal-50/40 shadow-inner">
                <Image
                  src="/images/content/theme-person-centred.png"
                  alt="Inclusive care illustration in soft clay style"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="card dashboard-card p-6">
            <div className="text-center">
              <div className="avatar-circle w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-user text-2xl" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{displayName}</h3>
              <p className="text-sm text-slate-600 mb-4">
                {dash.isLoading ? "Loading…" : `${certificatesCount} Certificate${certificatesCount === 1 ? "" : "s"}`}
              </p>
              <Link
                href="/portfolio"
                className="btn-teal inline-block w-full py-2 rounded-md text-center no-underline text-white hover:opacity-90 transition-opacity"
              >
                View portfolio
              </Link>
            </div>
          </div>

          <div className="card card-teal dashboard-card p-6">
            <div className="text-center text-white">
              <i className="fas fa-clipboard text-3xl mb-4" aria-hidden />
              <h3 className="text-lg font-semibold mb-3">Continue where you left off…</h3>
              {continueCourse ? (
                <>
                  <p className="text-sm mb-2 opacity-90">
                    You&apos;re {continueCourse.progress}% through {continueCourse.title}
                  </p>
                  <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mb-4">
                    <div
                      className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${continueCourse.progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm mb-4 opacity-90">
                  Start a course to see your progress here.
                </p>
              )}
              <Link
                href={continueCourse?.resumePath ?? "/courses"}
                className="btn-teal-outline inline-block w-full py-2 rounded-md text-center no-underline"
              >
                {continueCourse ? "Resume" : "Browse courses"}
              </Link>
            </div>
          </div>

          <div className="card card-pink dashboard-card p-6">
            <div className="text-center text-white">
              <i className="fas fa-book-open text-3xl mb-4" aria-hidden />
              <h3 className="text-lg font-semibold mb-3">
                Stay up to date with your compliance training
              </h3>
              <p className="text-sm mb-4 opacity-90">
                Keep your skills current with mandatory training
              </p>
              <Link
                href="/courses"
                className="btn-teal-outline inline-block w-full py-2 rounded-md text-center no-underline"
              >
                View courses
              </Link>
            </div>
          </div>

          <div className="card card-orange dashboard-card p-6">
            <div className="text-center text-white">
              <i className="fas fa-certificate text-3xl mb-4" aria-hidden />
              <h3 className="text-lg font-semibold mb-3">Are you open to work?</h3>
              <p className="text-sm mb-4 opacity-90">Share your achievements with employers</p>
              <Link
                href="/portfolio"
                className="btn-teal-outline inline-block w-full py-2 rounded-md text-center no-underline"
              >
                View portfolio
              </Link>
            </div>
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Activity</h2>
          <div className="card p-6">
            {dash.isLoading ? (
              <p className="text-sm text-slate-600">Loading activity…</p>
            ) : recent.length === 0 ? (
              <p className="text-sm text-slate-600">
                No activity yet. Start a course and your progress will appear here.
              </p>
            ) : (
              <div className="space-y-4">
                {recent.map((a, idx) => (
                  <div
                    key={`${a.updatedAt}-${idx}`}
                    className={`flex items-center justify-between py-3 ${idx < recent.length - 1 ? "border-b border-slate-200" : ""}`}
                  >
                    <div className="flex items-center">
                      <div
                        className={`${a.kind === "completed" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"} p-2 rounded-full mr-4`}
                      >
                        <i className={`fas ${a.kind === "completed" ? "fa-check" : "fa-play"}`} aria-hidden />
                      </div>
                      <div>
                        <p className="font-medium">
                          {a.kind === "completed" ? "Completed" : "Started"} {a.title}
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(a.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`${a.kind === "completed" ? "text-green-600" : "text-blue-600"} font-medium`}
                    >
                      {a.badge}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
