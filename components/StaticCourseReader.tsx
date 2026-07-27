"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActiveLearningChrome } from "@/components/learning/ActiveLearningChrome";
import { LearnerTrainingShell, type LearnerLesson } from "@/components/learning/LearnerTrainingShell";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { Course } from "@/lib/siteData";

function parseStepParam(s: string, chapterCount: number): number {
  if (s === "assessment") return chapterCount;
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= chapterCount) return n - 1;
  return 0;
}

function progressPercent(idx: number, totalSteps: number) {
  return Math.round(((idx + 1) / totalSteps) * 100);
}

function storageKey(courseSlug: string) {
  return `medcom_static_${courseSlug}_v1`;
}

function loadProgress(courseSlug: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(storageKey(courseSlug));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveProgress(courseSlug: string, set: Set<number>) {
  localStorage.setItem(storageKey(courseSlug), JSON.stringify([...set]));
}

function makeChapters(count: number) {
  return Array.from({ length: count }).map((_, i) => ({
    idx: i,
    title: `Chapter ${i + 1}`,
  }));
}

function placeholderMarkdown(courseTitle: string, chapterTitle: string) {
  return `
## ${chapterTitle}

This interactive lesson isn’t migrated yet, but the **learning flow is wired up** so every course can be started from the catalog.

### What you can do now
- Use **Next / Previous** to move through chapters
- Open the **Assessment** step at the end
- Return to the course overview at any time

### Next steps for this course
We can migrate the legacy HTML for **${courseTitle}** into real chapter content (Markdown or HTML) and add quizzes.
`;
}

function stripMarkdown(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function StaticCourseReader({ course, stepParam }: { course: Course; stepParam: string }) {
  const router = useRouter();
  const playerRef = useRef<HTMLDivElement>(null);
  const chapterCount = Math.max(6, Math.min(20, course.chapters || 10));
  const chapters = useMemo(() => makeChapters(chapterCount), [chapterCount]);
  const totalSteps = chapters.length + 1;
  const stepIndex = parseStepParam(stepParam, chapters.length);
  const isAssessment = stepIndex === chapters.length;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(true);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setCompleted(loadProgress(course.slug));
  }, [course.slug]);

  const goToStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSteps) return;
      const path =
        idx < chapters.length
          ? `/courses/${course.slug}/learn/${idx + 1}`
          : `/courses/${course.slug}/learn/assessment`;
      router.push(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSidebarOpen(false);
    },
    [chapters.length, course.slug, router, totalSteps]
  );

  const next = useCallback(() => {
    setCompleted((prevCompleted) => {
      const nextCompleted = new Set(prevCompleted);
      nextCompleted.add(stepIndex);
      saveProgress(course.slug, nextCompleted);
      return nextCompleted;
    });

    if (stepIndex < totalSteps - 1) {
      goToStep(stepIndex + 1);
    } else {
      alert("Course complete. Progress saved on this device.");
    }
  }, [course.slug, goToStep, stepIndex, totalSteps]);

  const prev = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable)
        return;
      if (e.key === "ArrowLeft" && stepIndex > 0) {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev, stepIndex]);

  const ch = !isAssessment ? chapters[stepIndex] : null;
  const title = isAssessment ? "Assessment" : `Chapter ${stepIndex + 1}: ${ch?.title ?? ""}`;
  const pct = progressPercent(stepIndex, totalSteps);
  const meta = isAssessment
    ? `Final step • ${totalSteps} of ${totalSteps}`
    : `Chapter ${stepIndex + 1} of ${chapters.length} • ${pct}% through module`;

  const md = isAssessment
    ? `## Assessment\n\nThis is a placeholder assessment for **${course.title}**.\n\n- We can port the legacy assessment content here.\n`
    : placeholderMarkdown(course.title, ch?.title ?? `Chapter ${stepIndex + 1}`);
  const lessonItems: LearnerLesson[] = useMemo(
    () => [
      ...chapters.map((chapter) => ({
        id: String(chapter.idx),
        title: chapter.title,
        minutes: 3,
      })),
      { id: "assessment", title: "Final assessment", minutes: 4 },
    ],
    [chapters]
  );
  const completedMinutes = lessonItems.reduce(
    (sum, lesson, idx) => sum + (completed.has(idx) ? lesson.minutes : 0),
    0
  );
  const totalMinutes = lessonItems.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const estimatedRemainingMinutes = Math.max(0, totalMinutes - completedMinutes);
  const activeEstimatedMinutes = isAssessment ? 4 : 3;
  const lessonText = stripMarkdown(md);
  const learningObjectives = [
    "Focus on one chapter at a time without leaving the learning flow.",
    "Use the chapter list to orient yourself, then return attention to the content.",
    "Use the final assessment to check understanding at the end.",
  ];

  const requestPlayerFullscreen = useCallback(async () => {
    if (fullscreen) {
      if (document.fullscreenElement) await document.exitFullscreen();
      setFullscreen(false);
      return;
    }
    setFullscreen(true);
    const el = playerRef.current;
    if (!el || !document.fullscreenEnabled) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await el.requestFullscreen();
  }, [fullscreen]);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div ref={playerRef}>
      <LearnerTrainingShell
        courseTitle={course.title}
        overviewHref={`/courses/${course.slug}/overview`}
        activeTitle={title}
        activeMeta={meta}
        activeLessonIndex={stepIndex}
        totalSteps={totalSteps}
        progressPercent={pct}
        completedLessons={completed.size}
        knowledgeChecksCompleted={completed.size}
        confidenceScore={Math.max(60, Math.min(95, pct + 20))}
        estimatedRemainingMinutes={estimatedRemainingMinutes}
        activeEstimatedMinutes={activeEstimatedMinutes}
        lessons={lessonItems}
        completed={completed}
        isAssessment={isAssessment}
        fullscreen={fullscreen}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onCloseSidebar={() => setSidebarOpen(false)}
        onGoToLesson={goToStep}
        onPrevious={prev}
        onNext={next}
        onHint={() =>
          alert(
            isAssessment
              ? "Hint. Use the course chapters to answer each question carefully."
              : `Hint. Focus on the main action or decision in ${ch?.title ?? "this chapter"}.`
          )
        }
        onToggleFullscreen={() => void requestPlayerFullscreen()}
        learningObjectives={learningObjectives}
        lessonText={lessonText}
      >
        <ActiveLearningChrome
          stepKey={stepParam}
          stepIndex={stepIndex}
          totalContentSteps={chapters.length}
          isAssessment={isAssessment}
          chapterTitle={ch?.title}
          learningOutcomes={learningObjectives}
          estimatedMinutes={activeEstimatedMinutes}
        >
          <div className="prose prose-slate max-w-none">
            <MarkdownContent markdown={md} />
          </div>
        </ActiveLearningChrome>
      </LearnerTrainingShell>
    </div>
  );
}
