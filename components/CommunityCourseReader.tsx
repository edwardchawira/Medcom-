"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActiveLearningChrome } from "@/components/learning/ActiveLearningChrome";
import { contentBannerForChapter } from "@/lib/contentThemes";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { ChapterQuizQuestion } from "@/components/learning/ChapterQuiz";
import { LearnerTrainingShell, type LearnerLesson } from "@/components/learning/LearnerTrainingShell";
import {
  FlorenceAssessment,
  type FlorenceAssessmentQuestion,
} from "@/components/learning/FlorenceAssessment";

export type CommunityChapter = {
  id: string;
  sort_order: number;
  title: string;
  content_md: string;
};

function parseStepParam(s: string, chapterCount: number): number {
  if (s === "assessment") return chapterCount;
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= chapterCount) return n - 1;
  return 0;
}

function progressPercent(idx: number, totalSteps: number) {
  return Math.round(((idx + 1) / totalSteps) * 100);
}

function loadProgressKey(slug: string) {
  return `medcom_community_${slug}_v1`;
}

function loadProgress(slug: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(loadProgressKey(slug));
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveProgress(slug: string, set: Set<number>) {
  localStorage.setItem(loadProgressKey(slug), JSON.stringify([...set]));
}

function estimatedMinutesForText(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 160));
}

function stripMarkdown(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function CommunityCourseReader({
  slug,
  courseTitle,
  learningOutcomes,
  chapters,
  assessmentHtml,
  stepParam,
  quizQuestions,
  assessmentQuestions,
}: {
  slug: string;
  courseTitle: string;
  learningOutcomes: string[];
  chapters: CommunityChapter[];
  assessmentHtml: string;
  stepParam: string;
  quizQuestions: ChapterQuizQuestion[];
  assessmentQuestions: FlorenceAssessmentQuestion[];
}) {
  const router = useRouter();
  const sorted = [...chapters].sort((a, b) => a.sort_order - b.sort_order);
  const totalSteps = sorted.length + 1;
  const stepIndex = parseStepParam(stepParam, sorted.length);
  const bodyRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const [fullscreen, setFullscreen] = useState(true);

  const isAssessment = stepIndex === sorted.length;
  const isLast = stepIndex >= totalSteps - 1;

  useEffect(() => {
    setCompleted(loadProgress(slug));
  }, [slug]);

  const goToStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSteps) return;
      const path =
        idx < sorted.length
          ? `/courses/community/${slug}/learn/${idx + 1}`
          : `/courses/community/${slug}/learn/assessment`;
      router.push(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSidebarOpen(false);
    },
    [router, slug, sorted.length, totalSteps]
  );

  const advanceToNextStep = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      setCompleted((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(stepIndex);
        saveProgress(slug, nextSet);
        return nextSet;
      });
      goToStep(stepIndex + 1);
    } else {
      setCompleted((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(stepIndex);
        saveProgress(slug, nextSet);
        return nextSet;
      });
      alert("Module complete. Progress saved on this device.");
    }
  }, [goToStep, slug, stepIndex, totalSteps]);

  const next = useCallback(() => {
    advanceToNextStep();
  }, [advanceToNextStep]);

  const prev = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  // Community courses use structured quiz UI + markdown content (no HTML binding).

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

  const ch = !isAssessment ? sorted[stepIndex] : null;
  const title = isAssessment
    ? "Final assessment"
    : `Chapter ${stepIndex + 1}: ${ch?.title ?? ""}`;
  const meta = isAssessment
    ? `Final step • ${totalSteps} of ${totalSteps}`
    : `Chapter ${stepIndex + 1} of ${sorted.length} • ${progressPercent(stepIndex, totalSteps)}% through module`;
  const bodyMd = isAssessment ? assessmentHtml : ch?.content_md ?? "";
  const pct = progressPercent(stepIndex, totalSteps);
  const estimatedMinutes = useMemo(() => estimatedMinutesForText(bodyMd), [bodyMd]);
  const totalEstimatedMinutes = useMemo(
    () =>
      sorted.reduce((sum, chapter) => sum + estimatedMinutesForText(chapter.content_md), 0) +
      Math.max(4, assessmentQuestions.length * 2),
    [assessmentQuestions.length, sorted]
  );
  const hintText = isAssessment
    ? "Hint. Read each question carefully, eliminate unsafe options first, and choose the answer best supported by the course."
    : `Hint. Focus on how ${ch?.title ?? "this section"} changes what you would check, record, or escalate in practice.`;
  const outcomes =
    learningOutcomes.length > 0
      ? learningOutcomes
      : [
          "Work through each chapter and use the questions at the end to check understanding.",
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

  const lessonItems: LearnerLesson[] = useMemo(
    () => [
      ...sorted.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        minutes: estimatedMinutesForText(chapter.content_md),
      })),
      {
        id: "assessment",
        title: "Final assessment",
        minutes: Math.max(4, assessmentQuestions.length * 2),
      },
    ],
    [assessmentQuestions.length, sorted]
  );
  const completedMinutes = lessonItems.reduce(
    (sum, lesson, idx) => sum + (completed.has(idx) ? lesson.minutes : 0),
    0
  );
  const estimatedRemainingMinutes = Math.max(0, totalEstimatedMinutes - completedMinutes);

  return (
    <div ref={playerRef}>
      <LearnerTrainingShell
        courseTitle={courseTitle}
        overviewHref={`/courses/community/${slug}/overview`}
        activeTitle={title}
        activeMeta={meta}
        activeLessonIndex={stepIndex}
        totalSteps={totalSteps}
        progressPercent={pct}
        completedLessons={completed.size}
        knowledgeChecksCompleted={completed.size + (quizQuestions.length > 0 ? 1 : 0)}
        confidenceScore={Math.max(64, Math.min(96, pct + 20))}
        estimatedRemainingMinutes={estimatedRemainingMinutes}
        activeEstimatedMinutes={estimatedMinutes}
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
        onHint={() => alert(hintText)}
        onToggleFullscreen={() => void requestPlayerFullscreen()}
        learningObjectives={outcomes}
        lessonText={stripMarkdown(bodyMd)}
      >
          {/* Record progress for home dashboard */}
          <ProgressReporter
            courseKey={`community-${slug}`}
            courseTitle={courseTitle}
            status={isAssessment && isLast ? "completed" : "in_progress"}
            progress={pct}
            resumePath={
              isAssessment
                ? `/courses/community/${slug}/learn/assessment`
                : `/courses/community/${slug}/learn/${stepIndex + 1}`
            }
          />
          {!isAssessment ? (
            <>
              <ActiveLearningChrome
                stepKey={stepParam}
                stepIndex={stepIndex}
                totalContentSteps={sorted.length}
                isAssessment={false}
                chapterTitle={ch?.title}
                learningOutcomes={outcomes}
                estimatedMinutes={estimatedMinutes}
                contentBannerSrc={contentBannerForChapter(stepIndex)}
              >
                <div ref={bodyRef}>
                  <MarkdownContent markdown={bodyMd} />
                </div>
              </ActiveLearningChrome>
            </>
          ) : null}

          {isAssessment && assessmentQuestions.length > 0 ? (
            <div className="mt-2">
              <FlorenceAssessment questions={assessmentQuestions} questionsPerPage={2} />
            </div>
          ) : null}
      </LearnerTrainingShell>
    </div>
  );
}

function ProgressReporter({
  courseKey,
  courseTitle,
  status,
  progress,
  resumePath,
}: {
  courseKey: string;
  courseTitle: string;
  status: "in_progress" | "completed";
  progress: number;
  resumePath: string;
}) {
  useEffect(() => {
    void fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseKey,
        courseTitle,
        status,
        progress,
        resumePath,
      }),
    });
  }, [courseKey, courseTitle, progress, resumePath, status]);
  return null;
}
