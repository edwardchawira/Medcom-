"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
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

export function PreAuthCoursesExplorer({
  onAuthRequested,
}: {
  onAuthRequested: () => void;
}) {
  const [category, setCategory] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("");
  const [collection, setCollection] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  function promptAuth() {
    onAuthRequested();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
      <div className="space-y-3">
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

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full border border-slate-300 rounded-lg px-4 h-12 flex items-center justify-between bg-white hover:bg-slate-50 transition"
          aria-expanded={filtersOpen}
          aria-controls="preauth-filters"
        >
          <span className="inline-flex items-center gap-3 text-slate-700">
            <i className="fas fa-sliders text-slate-500" aria-hidden />
            Filter courses
          </span>
          <i
            className={`fas fa-chevron-down text-slate-500 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>

        {filtersOpen ? (
          <div
            id="preauth-filters"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <select
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
            <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
              <button
                type="button"
                className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courseGrid">
        {filtered.map((course) => (
          <article
            key={course.id}
            className="course-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
          >
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
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
              <div className="flex justify-between text-sm text-slate-600 mb-4">
                <span>{course.chapters} chapters</span>
                <span>{course.duration}</span>
              </div>
              <button
                type="button"
                onClick={promptAuth}
                className="mt-auto w-full text-center border-2 border-teal-600 text-teal-600 py-2 rounded-md hover:bg-teal-600 hover:text-white transition-colors font-medium"
              >
                Start training
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
