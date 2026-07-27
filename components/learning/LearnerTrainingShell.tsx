"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  Home,
  Layers3,
  Lightbulb,
  Lock,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";

export type LearnerLesson = {
  id: string;
  title: string;
  minutes: number;
  locked?: boolean;
};

type Props = {
  courseTitle: string;
  overviewHref: string;
  activeTitle: string;
  activeMeta: string;
  activeLessonIndex: number;
  totalSteps: number;
  progressPercent: number;
  completedLessons: number;
  knowledgeChecksCompleted?: number;
  confidenceScore?: number;
  estimatedRemainingMinutes: number;
  activeEstimatedMinutes: number;
  lessons: LearnerLesson[];
  completed: Set<number>;
  isAssessment: boolean;
  fullscreen: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onGoToLesson: (idx: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onHint: () => void;
  onToggleFullscreen: () => void;
  learningObjectives: string[];
  lessonText: string;
  children: ReactNode;
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

function moduleNumber(index: number, lessonCount: number) {
  if (index >= lessonCount - 1) return 4;
  if (index >= Math.ceil(lessonCount * 0.66)) return 3;
  if (index >= Math.ceil(lessonCount * 0.38)) return 2;
  return 1;
}

const RAIL_STORAGE_KEY = "medcom_learning_module_rail_expanded";
let cachedRailExpanded: boolean | null = null;

function loadRailExpanded() {
  if (cachedRailExpanded != null) return cachedRailExpanded;
  if (typeof window === "undefined") return false;
  try {
    const expanded = window.localStorage.getItem(RAIL_STORAGE_KEY) !== "false";
    cachedRailExpanded = expanded;
    return expanded;
  } catch {
    return false;
  }
}

function saveRailExpanded(expanded: boolean) {
  cachedRailExpanded = expanded;
  try {
    window.localStorage.setItem(RAIL_STORAGE_KEY, String(expanded));
  } catch {
    // Persistence is a convenience; the rail still works without storage.
  }
}

export function LearnerTrainingShell({
  courseTitle,
  overviewHref,
  activeTitle,
  activeLessonIndex,
  totalSteps,
  progressPercent,
  completedLessons,
  estimatedRemainingMinutes,
  activeEstimatedMinutes,
  lessons,
  completed,
  isAssessment,
  sidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
  onGoToLesson,
  onPrevious,
  onNext,
  onHint,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] };
  const [railExpanded, setRailExpandedState] = useState(() => cachedRailExpanded ?? false);
  const [openModules, setOpenModules] = useState<Set<number>>(() => new Set([1]));
  const isLast = activeLessonIndex >= totalSteps - 1;

  function setRailExpanded(expanded: boolean) {
    setRailExpandedState(expanded);
    saveRailExpanded(expanded);
  }

  useEffect(() => {
    setRailExpandedState(loadRailExpanded());
  }, []);

  const modules = useMemo(() => {
    const contentLessons = lessons.slice(0, Math.max(0, lessons.length - 1));
    const groups = new Map<number, Array<LearnerLesson & { originalIndex: number }>>();
    contentLessons.forEach((lesson, index) => {
      const n = moduleNumber(index, contentLessons.length);
      groups.set(n, [...(groups.get(n) ?? []), { ...lesson, originalIndex: index }]);
    });
    return Array.from(groups.entries()).map(([number, items]) => ({
      number,
      title: number === 1 ? courseTitle : number === 2 ? "Core practice and implementation" : number === 3 ? "Applied safety topics" : "Course completion",
      items,
    }));
  }, [courseTitle, lessons]);

  function toggleModule(module: number) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#f1f2f3] text-[#3d4b55]">
      <div
        className={`fixed inset-0 z-40 bg-slate-950/35 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseSidebar}
        aria-hidden={!sidebarOpen}
      />

      <aside
        className={`alison-sidebar fixed left-0 top-0 z-50 h-screen overflow-y-auto border-r border-slate-200 bg-white shadow-md transition-all duration-200 ${
          railExpanded ? "w-[324px]" : "w-[86px]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        aria-label="Course modules"
      >
        <div className="sticky top-0 z-10 flex h-[58px] items-center gap-3 bg-[#082949] px-4 text-white">
          <Layers3 className="h-7 w-7 shrink-0 text-[#0697cf]" aria-hidden />
          {railExpanded ? <h2 className="truncate text-base font-bold">Course Modules</h2> : null}
          <button
            type="button"
            onClick={() => setRailExpanded(!railExpanded)}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70"
            aria-label={railExpanded ? "Collapse course modules" : "Expand course modules"}
            title={railExpanded ? "Collapse course modules" : "Expand course modules"}
          >
            {railExpanded ? (
              <PanelLeftClose className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeftOpen className="h-5 w-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={onCloseSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-white/10 md:hidden"
            aria-label="Close modules"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <nav aria-label="Course lesson list">
          {modules.map((module) => {
            const moduleActive = module.items.some((lesson) => lesson.originalIndex === activeLessonIndex);
            const moduleOpen = railExpanded && (openModules.has(module.number) || moduleActive);
            return (
              <section key={module.number} className={moduleActive ? "bg-[#fff5dd]" : "bg-white"}>
                <button
                  type="button"
                  onClick={() => toggleModule(module.number)}
                  className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left ${
                    moduleActive ? "bg-[#fff5dd]" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      moduleActive ? "bg-[#ffc05a] text-white" : "bg-slate-200 text-slate-500"
                    }`}
                    aria-hidden
                  >
                    <Layers3 className="h-3.5 w-3.5" />
                  </span>
                  {railExpanded ? (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase text-[#0094d2]">
                          Module {module.number}
                        </span>
                        <span className="mt-1 block text-sm font-medium leading-snug text-[#40515c]">
                          {module.title}
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#8195a2] transition-transform ${
                          moduleOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </>
                  ) : null}
                </button>

                <AnimatePresence initial={false}>
                  {moduleOpen ? (
                    <motion.div
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={transition}
                      className="overflow-hidden"
                    >
                      {module.items.map((lesson) => {
                        const active = lesson.originalIndex === activeLessonIndex;
                        const done = completed.has(lesson.originalIndex);
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            disabled={lesson.locked}
                            onClick={() => onGoToLesson(lesson.originalIndex)}
                            className={`group flex min-h-[76px] w-full items-start gap-3 border-b border-[#d8edf5] px-10 py-3 text-left transition ${
                              active
                                ? "bg-[#fff7dd]"
                                : done
                                  ? "bg-[#edfaff]"
                                  : "bg-[#eefbff] hover:bg-[#e5f7fd]"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                            aria-current={active ? "step" : undefined}
                          >
                            <span
                              className={`mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                                done
                                  ? "bg-[#00a36c] text-white"
                                  : active
                                    ? "bg-[#ffc05a] text-white"
                                    : "bg-slate-300 text-white"
                              }`}
                              aria-hidden
                            >
                              {done ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] leading-snug text-[#40515c]">
                                {lesson.originalIndex + 1}. {lesson.title}
                              </span>
                              <span className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8aa0ad]">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                                  {formatDuration(lesson.minutes)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <FileText className="h-3.5 w-3.5" aria-hidden />
                                  {Math.max(1, Math.round(lesson.minutes * 1.2))}
                                </span>
                                {lesson.locked ? <Lock className="h-3.5 w-3.5" aria-hidden /> : null}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </section>
            );
          })}

          <button
            type="button"
            onClick={() => onGoToLesson(lessons.length - 1)}
            className={`flex min-h-[68px] w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left ${
              isAssessment ? "bg-[#fff7dd]" : "bg-white hover:bg-slate-50"
            }`}
            aria-current={isAssessment ? "step" : undefined}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#44b9dd] text-white">
              <ClipboardList className="h-4 w-4" aria-hidden />
            </span>
            {railExpanded ? <span className="text-sm font-medium">Course Assessment</span> : null}
          </button>

          <Link
            href={overviewHref}
            className="flex min-h-[56px] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
          >
            <Home className="h-5 w-5 text-[#8499a6]" aria-hidden />
            {railExpanded ? <span className="text-sm font-medium">Course overview</span> : null}
          </Link>
        </nav>
      </aside>

      <main
        className={`min-h-screen pb-28 transition-[padding] duration-200 ${
          railExpanded ? "md:pl-[324px]" : "md:pl-[86px]"
        }`}
        aria-live="polite"
      >
        <div className="flex min-h-screen flex-col bg-[#f1f2f3] px-4 py-9 sm:px-7 lg:px-10">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#082949] text-white shadow-sm md:hidden"
              aria-label="Open course modules"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setRailExpanded(true)}
              className="rounded-md bg-[#3f4d57] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#303a42]"
            >
              Course Modules
            </button>
            <button
              type="button"
              onClick={onHint}
              className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-[#5d6b75] shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              aria-label="Show hint"
              title="Show hint"
            >
              <Lightbulb className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mx-auto w-full max-w-[964px] flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeLessonIndex}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                transition={transition}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_18px_rgba(15,23,42,0.08)] backdrop-blur">
        <div
          className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 transition-[padding] sm:px-5 ${
            railExpanded ? "md:pl-[344px]" : "md:pl-[106px]"
          }`}
        >
          <button
            type="button"
            disabled={activeLessonIndex === 0}
            onClick={onPrevious}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-[#40515c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-xs font-medium text-[#6f818c]">
              {activeTitle} · {progressPercent}% complete · {completedLessons} done ·{" "}
              {formatDuration(estimatedRemainingMinutes)} remaining
            </p>
            <div className="mx-auto mt-1 h-1 max-w-md overflow-hidden rounded-full bg-slate-200">
              <motion.div
                className="h-full rounded-full bg-[#0099d1]"
                style={{ width: `${progressPercent}%` }}
                transition={transition}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#082949] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0b355d]"
          >
            {isLast ? "Finish" : "Next"}
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </footer>

      <div className="sr-only">
        <BookOpen aria-hidden />
        Current lesson takes {formatDuration(activeEstimatedMinutes)}.
      </div>
    </div>
  );
}
