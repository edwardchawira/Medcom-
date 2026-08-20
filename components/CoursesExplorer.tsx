"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMe } from "@/lib/auth/useMe";
import { staticCourseToCatalog } from "@/lib/catalogCourse";
import { courses as allCourses } from "@/lib/siteData";
import { filterCourses, type CourseFilters } from "@/lib/courseFilters";

const categories = [
  "Community",
  "Medicines Management",
  "Long Term Conditions",
  "Fundamentals",
  "Legislation",
  "Complex Care",
  "Statutory and Mandatory",
  "Health and Safety",
];

const audiences = [
  "Care Assistant",
  "Senior Care Assistant",
  "Registered Manager",
  "Nurse",
  "Other staff",
];

const durationBuckets = ["0-10", "10-20", "20-30", "30-40", "40-60", "60+"];

const collectionNames = [
  "Care Essentials collection",
  "Advanced Safeguarding collection (L3)",
  "Care Leader collection",
  "Pathway to Care collection",
];

export function CoursesExplorer() {
  const { data } = useMe();
  const authed = !!(data && "user" in data && data.user);
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [collection, setCollection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const staticCatalog = useMemo(() => allCourses.map(staticCourseToCatalog), []);

  const filters: CourseFilters = useMemo(
    () => ({
      category,
      audience,
      duration,
      collection,
      searchTerm: searchTerm.trim().toLowerCase(),
    }),
    [audience, category, collection, duration, searchTerm]
  );

  const filtered = useMemo(
    () => filterCourses(staticCatalog, filters),
    [filters, staticCatalog]
  );

  function clearFilters() {
    setCategory("");
    setAudience("");
    setDuration("");
    setCollection("");
  }

  return (
    <div className="content-container max-w-6xl mx-auto px-4 sm:px-8 pt-9 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
        {authed ? (
          <Link
            href="/courses/upload"
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 no-underline"
          >
            <i className="fas fa-plus mr-2 text-xs" aria-hidden />
            Create course
          </Link>
        ) : null}
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <div className="search-bar border border-slate-300 rounded-lg px-4 h-12 flex items-center focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 bg-white">
          <i className="fas fa-search text-slate-400" aria-hidden />
          <input
            type="search"
            placeholder="Search courses"
            className="flex-1 border-none outline-none ml-3 text-slate-800 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search courses"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            id="filterCategory"
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            id="filterAudience"
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            <option value="">Audience</option>
            {audiences.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            id="filterDuration"
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="">Duration (min)</option>
            {durationBuckets.map((d) => (
              <option key={d} value={d}>
                {d === "60+" ? "60+ minutes" : `${d} min`}
              </option>
            ))}
          </select>
          <select
            id="filterCollection"
            className="border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          >
            <option value="">Collection</option>
            {collectionNames.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courseGrid">
        {filtered.map((course) => (
          <article
            key={course.id}
            className="course-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
          >
            <Link href={course.detailPath} className="block">
              <div className="relative h-48 w-full">
                <Image
                  src={course.thumbnail}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 100vw, 33vw"
                  unoptimized
                />
              </div>
            </Link>
            <div className="p-6 flex flex-col flex-1">
              <Link href={course.detailPath} className="hover:opacity-95 transition-opacity">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
              </Link>
              <div className="flex justify-between text-sm text-slate-600 mb-4">
                <span>{course.chapters} chapters</span>
                <span>{course.duration}</span>
              </div>
              <Link
                href={course.startPath}
                className="mt-auto w-full block text-center border-2 border-teal-600 text-teal-600 py-2 rounded-md hover:bg-teal-600 hover:text-white transition-colors font-medium"
              >
                Start training
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
