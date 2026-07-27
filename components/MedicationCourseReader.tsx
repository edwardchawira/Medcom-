"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { medicationCourse } from "@/lib/medicationCourseData";
import { bindChapterMcqs } from "@/lib/bindChapterMcqs";
import { ActiveLearningChrome } from "@/components/learning/ActiveLearningChrome";
import { contentBannerForChapter } from "@/lib/contentThemes";
import { CheckpointModal } from "@/components/learning/CheckpointModal";
import { LearnerTrainingShell, type LearnerLesson } from "@/components/learning/LearnerTrainingShell";
import { sanitizeLearningHtml } from "@/lib/sanitizeHtml";
import {
  getCheckpointWhenLeavingStep,
  isCheckpointPassed,
  markCheckpointPassedId,
  type MedicationCheckpoint,
} from "@/lib/medicationCheckpoints";

const STORAGE_KEY = "medcom_medication_course_v1";

function loadProgress(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveProgress(set: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

function parseStepParam(
  s: string,
  chapterCount: number
): number {
  if (s === "assessment") return chapterCount;
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= chapterCount) return n - 1;
  return 0;
}

function progressPercent(idx: number, totalSteps: number) {
  return Math.round(((idx + 1) / totalSteps) * 100);
}

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function estimatedMinutesForHtml(html: string) {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 160));
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function MedicationCourseReader({ stepParam }: { stepParam: string }) {
  const router = useRouter();
  const course = medicationCourse;
  const chapters = course.chapters;
  const totalSteps = chapters.length + 1;
  const stepIndex = parseStepParam(stepParam, chapters.length);
  const bodyRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const [checkpointOpen, setCheckpointOpen] = useState<MedicationCheckpoint | null>(null);
  const [fullscreen, setFullscreen] = useState(true);

  const isAssessment = stepIndex === chapters.length;
  const isLast = stepIndex >= totalSteps - 1;

  useEffect(() => {
    setCompleted(loadProgress());
  }, []);

  const goToStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSteps) return;
      const path =
        idx < chapters.length
          ? `/courses/medication-home-care/learn/${idx + 1}`
          : `/courses/medication-home-care/learn/assessment`;
      router.push(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSidebarOpen(false);
    },
    [chapters.length, router, totalSteps]
  );

  const advanceToNextStep = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      setCompleted((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(stepIndex);
        saveProgress(nextSet);
        return nextSet;
      });
      goToStep(stepIndex + 1);
    } else {
      setCompleted((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(stepIndex);
        saveProgress(nextSet);
        return nextSet;
      });
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseKey: "static-medication-home-care",
          courseTitle: medicationCourse.courseTitle,
          status: "completed",
          progress: 100,
          resumePath: "/portfolio",
        }),
      });
      alert("Module complete (demo). Progress saved in your browser.");
    }
  }, [goToStep, stepIndex, totalSteps]);

  const next = useCallback(() => {
    if (stepIndex < totalSteps - 1) {
      const cp = getCheckpointWhenLeavingStep(stepIndex);
      if (cp && !isCheckpointPassed(cp.id)) {
        setCheckpointOpen(cp);
        return;
      }
    }
    advanceToNextStep();
  }, [advanceToNextStep, stepIndex, totalSteps]);

  const handleCheckpointPassed = useCallback(() => {
    setCheckpointOpen((prev) => {
      if (prev) markCheckpointPassedId(prev.id);
      return null;
    });
    advanceToNextStep();
  }, [advanceToNextStep]);

  const prev = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    bindChapterMcqs(root);
  }, [stepIndex, isAssessment]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (checkpointOpen) return;
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
  }, [checkpointOpen, next, prev, stepIndex]);

  const ch = !isAssessment ? chapters[stepIndex] : null;
  const title = isAssessment
    ? "Assessment"
    : `Chapter ${stepIndex + 1}: ${ch?.title ?? ""}`;
  const meta = isAssessment
    ? `Final step • ${totalSteps} of ${totalSteps}`
    : `Chapter ${stepIndex + 1} of ${chapters.length} • ${progressPercent(stepIndex, totalSteps)}% through module`;
  const bodyHtml = isAssessment
    ? course.assessmentHtml
    : ch?.html ?? "";
  const safeBodyHtml = useMemo(() => sanitizeLearningHtml(bodyHtml), [bodyHtml]);
  const pct = progressPercent(stepIndex, totalSteps);
  const estimatedMinutes = useMemo(() => estimatedMinutesForHtml(safeBodyHtml), [safeBodyHtml]);
  const totalEstimatedMinutes = useMemo(
    () =>
      chapters.reduce((sum, chapter) => sum + estimatedMinutesForHtml(chapter.html), 0) +
      estimatedMinutesForHtml(course.assessmentHtml),
    [chapters, course.assessmentHtml]
  );
  const hintText = isAssessment
    ? "Hint. Read each question carefully. Focus on safe practice, consent, documentation, and escalation."
    : `Hint. For ${ch?.title ?? "this section"}, identify what you would check, record, and escalate during a real home care visit.`;

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

  useEffect(() => {
    void fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseKey: "static-medication-home-care",
        courseTitle: medicationCourse.courseTitle,
        status: "in_progress",
        progress: pct,
        resumePath: isAssessment
          ? "/courses/medication-home-care/learn/assessment"
          : `/courses/medication-home-care/learn/${stepIndex + 1}`,
      }),
    });
  }, [isAssessment, pct, stepIndex]);

  const lessonItems: LearnerLesson[] = useMemo(
    () => [
      ...chapters.map((chapter) => ({
        id: String(chapter.id),
        title: chapter.title,
        minutes: estimatedMinutesForHtml(chapter.html),
      })),
      {
        id: "assessment",
        title: "Final assessment",
        minutes: estimatedMinutesForHtml(course.assessmentHtml),
      },
    ],
    [chapters, course.assessmentHtml]
  );
  const completedMinutes = lessonItems.reduce(
    (sum, lesson, idx) => sum + (completed.has(idx) ? lesson.minutes : 0),
    0
  );
  const estimatedRemainingMinutes = Math.max(0, totalEstimatedMinutes - completedMinutes);

  return (
    <div ref={playerRef}>
      {checkpointOpen ? (
        <CheckpointModal
          checkpoint={checkpointOpen}
          onPassed={handleCheckpointPassed}
          onStay={() => setCheckpointOpen(null)}
        />
      ) : null}
      <LearnerTrainingShell
        courseTitle={course.courseTitle}
        overviewHref="/courses/medication-home-care/overview"
        activeTitle={title}
        activeMeta={meta}
        activeLessonIndex={stepIndex}
        totalSteps={totalSteps}
        progressPercent={pct}
        completedLessons={completed.size}
        knowledgeChecksCompleted={completed.size}
        confidenceScore={Math.max(65, Math.min(96, pct + 24))}
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
        learningObjectives={course.learningOutcomes}
        lessonText={stripHtml(safeBodyHtml)}
      >
        <ActiveLearningChrome
            stepKey={stepParam}
            stepIndex={stepIndex}
            totalContentSteps={chapters.length}
            isAssessment={isAssessment}
            chapterTitle={ch?.title}
            learningOutcomes={course.learningOutcomes}
            estimatedMinutes={estimatedMinutes}
            contentBannerSrc={isAssessment ? undefined : contentBannerForChapter(stepIndex)}
          >
            <div
              ref={bodyRef}
              className="max-w-none text-slate-800 leading-relaxed [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-teal-700 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-teal-900"
              dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
            />
        </ActiveLearningChrome>
      </LearnerTrainingShell>
    </div>
  );
}
