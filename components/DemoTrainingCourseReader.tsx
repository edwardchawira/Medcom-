"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActiveLearningChrome } from "@/components/learning/ActiveLearningChrome";
import { InteractiveTopicCard } from "@/components/learning/InteractiveTopicCard";
import type { FlorenceAssessmentQuestion } from "@/components/learning/FlorenceAssessment";
import { LearnerTrainingShell, type LearnerLesson } from "@/components/learning/LearnerTrainingShell";
import { demoTrainingCourse } from "@/lib/demoTrainingCourse";
import { sanitizeLearningHtml } from "@/lib/sanitizeHtml";

const STORAGE_KEY = "medcom_demo_ai_healthcare_learning_v1";
const PASS_MARK = 80;
const CERTIFICATE_PROVIDER = "Medcom Training";
const CERTIFICATE_CPD_HOURS = "0.5";
const CERTIFICATE_CPD_POINTS = "0.5";
const CERTIFICATE_LEVEL = "Awareness";
const CPD_BADGE_SRC = "/images/cpd-certified-badge.png";

type CertificateRecord = {
  learnerName: string;
  courseTitle: string;
  issuedAt: string;
  scorePercent: number;
  scoreLabel: string;
  certificateId: string;
};

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

function issueLocalDemoCertificate({
  learnerName,
  score,
  total,
  scorePercent,
}: {
  learnerName: string;
  score: number;
  total: number;
  scorePercent: number;
}): CertificateRecord {
  const issuedAt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date());
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();

  return {
    learnerName,
    courseTitle: demoTrainingCourse.title,
    issuedAt,
    scorePercent,
    scoreLabel: `${score}/${total}`,
    certificateId: `MEDCOM-DEMO-${randomId}`,
  };
}

function parseStepParam(s: string, lessonCount: number): number {
  if (s === "assessment") return lessonCount;
  const n = parseInt(s, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= lessonCount) return n - 1;
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

export function DemoTrainingCourseReader({ stepParam }: { stepParam: string }) {
  const router = useRouter();
  const playerRef = useRef<HTMLDivElement>(null);
  const lessons = demoTrainingCourse.lessons;
  const totalSteps = lessons.length + 1;
  const stepIndex = parseStepParam(stepParam, lessons.length);
  const activeLesson = stepIndex < lessons.length ? lessons[stepIndex] : null;
  const isAssessment = stepIndex === lessons.length;
  const isLast = stepIndex >= totalSteps - 1;

  const [completed, setCompleted] = useState<Set<number>>(() => new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(true);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [certificateReady, setCertificateReady] = useState(false);

  useEffect(() => {
    setCompleted(loadProgress());
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadCertificate() {
      try {
        const response = await fetch("/api/certificates/demo", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { certificate: CertificateRecord | null };
        if (alive) setCertificate(payload.certificate);
      } finally {
        if (alive) setCertificateReady(true);
      }
    }
    void loadCertificate();
    return () => {
      alive = false;
    };
  }, []);

  const lessonItems: LearnerLesson[] = useMemo(
    () => [
      ...lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        minutes: lesson.minutes,
      })),
      { id: "assessment", title: "Final assessment", minutes: 6 },
    ],
    [lessons]
  );

  const totalMinutes = lessonItems.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const completedMinutes = lessonItems.reduce(
    (sum, lesson, idx) => sum + (completed.has(idx) ? lesson.minutes : 0),
    0
  );
  const estimatedRemainingMinutes = Math.max(0, totalMinutes - completedMinutes);
  const pct = progressPercent(stepIndex, totalSteps);
  const activeTitle = isAssessment
    ? "Final assessment"
    : `Lesson ${stepIndex + 1}: ${activeLesson?.title ?? ""}`;
  const activeMeta = isAssessment
    ? `Final step - ${totalSteps} of ${totalSteps}`
    : `${activeLesson?.kind ?? "lesson"} - ${stepIndex + 1} of ${lessons.length} - ${pct}% complete`;
  const lessonText = isAssessment
    ? "Final assessment for the AI healthcare learning experience demo."
    : stripHtml(sanitizeLearningHtml(activeLesson?.html ?? ""));
  const activeLessonHtml = useMemo(
    () => sanitizeLearningHtml(activeLesson?.html ?? ""),
    [activeLesson?.html]
  );
  const objectives = activeLesson?.objectives ?? demoTrainingCourse.learningOutcomes;
  const activeMinutes = activeLesson?.minutes ?? 6;

  const goToStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= totalSteps) return;
      const path =
        idx < lessons.length
          ? `/courses/${demoTrainingCourse.slug}/learn/${idx + 1}`
          : `/courses/${demoTrainingCourse.slug}/learn/assessment`;
      router.push(path);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSidebarOpen(false);
    },
    [lessons.length, router, totalSteps]
  );

  const next = useCallback(() => {
    if (isAssessment && !certificate) {
      alert("Submit and pass the final assessment to unlock your certificate.");
      return;
    }

    setCompleted((prev) => {
      const nextSet = new Set(prev);
      nextSet.add(stepIndex);
      saveProgress(nextSet);
      return nextSet;
    });

    if (!isLast) {
      goToStep(stepIndex + 1);
    } else {
      alert("Demo complete. Progress saved on this device.");
    }
  }, [certificate, goToStep, isAssessment, isLast, stepIndex]);

  const prev = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [goToStep, stepIndex]);

  const hintText = isAssessment
    ? "Hint. Answer from the course content only: focus, safe escalation, and learner support."
    : `Hint. In this lesson, focus on ${objectives[0]?.toLowerCase() ?? "the safest next action"}.`;

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

  const handleAssessmentPassed = useCallback(
    (record: CertificateRecord) => {
      setCertificate(record);
      setCompleted((prev) => {
        const nextSet = new Set(prev);
        nextSet.add(stepIndex);
        saveProgress(nextSet);
        return nextSet;
      });
    },
    [stepIndex]
  );

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

  return (
    <div ref={playerRef}>
      <LearnerTrainingShell
        courseTitle={demoTrainingCourse.title}
        overviewHref={`/courses/${demoTrainingCourse.slug}/overview`}
        activeTitle={activeTitle}
        activeMeta={activeMeta}
        activeLessonIndex={stepIndex}
        totalSteps={totalSteps}
        progressPercent={pct}
        completedLessons={completed.size}
        knowledgeChecksCompleted={completed.size}
        confidenceScore={Math.max(70, Math.min(96, pct + 18))}
        estimatedRemainingMinutes={estimatedRemainingMinutes}
        activeEstimatedMinutes={activeMinutes}
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
        learningObjectives={objectives}
        lessonText={lessonText}
      >
        {!isAssessment && activeLesson ? (
          <>
            <ActiveLearningChrome
              stepKey={stepParam}
              stepIndex={stepIndex}
              totalContentSteps={lessons.length}
              isAssessment={false}
              chapterTitle={activeLesson.title}
              learningOutcomes={objectives}
              estimatedMinutes={activeLesson.minutes}
            >
              <div dangerouslySetInnerHTML={{ __html: activeLessonHtml }} />
              {activeLesson.interactiveCards?.map((card) => (
                <InteractiveTopicCard
                  key={card.title}
                  title={card.title}
                  intro={card.intro}
                  topics={card.topics}
                />
              ))}
            </ActiveLearningChrome>
          </>
        ) : (
          <DemoFinalAssessment
            questions={demoTrainingCourse.assessment}
            certificate={certificate}
            certificateReady={certificateReady}
            onPassed={handleAssessmentPassed}
          />
        )}
      </LearnerTrainingShell>
    </div>
  );
}

function DemoFinalAssessment({
  questions,
  certificate,
  certificateReady,
  onPassed,
}: {
  questions: FlorenceAssessmentQuestion[];
  certificate: CertificateRecord | null;
  certificateReady: boolean;
  onPassed: (record: CertificateRecord) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [learnerName, setLearnerName] = useState("Demo Learner");
  const total = questions.length;
  const answered = questions.reduce((sum, q) => sum + (answers[q.id] != null ? 1 : 0), 0);
  const score = questions.reduce((sum, q) => {
    const answer = answers[q.id];
    return sum + (answer != null && answer === q.correctIndex ? 1 : 0);
  }, 0);
  const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = submitted && scorePercent >= PASS_MARK;
  const failed = submitted && !passed;

  async function submit() {
    setSubmitted(true);
    setSubmitError("");
    if (scorePercent < PASS_MARK) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/certificates/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerName: learnerName.trim() || "Demo Learner",
          answers: Object.fromEntries(
            Object.entries(answers).filter((entry): entry is [string, number] => entry[1] != null)
          ),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { certificate?: CertificateRecord; error?: string }
        | null;
      if (!response.ok || !payload?.certificate) {
        throw new Error(payload?.error ?? "Could not issue certificate.");
      }
      onPassed(payload.certificate);
    } catch (err) {
      console.warn("Server certificate issue failed; using local demo certificate.", err);
      onPassed(
        issueLocalDemoCertificate({
          learnerName: learnerName.trim() || "Demo Learner",
          score,
          total,
          scorePercent,
        })
      );
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
          Final assessment
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Pass the course to unlock your certificate
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Best-practice completion flow: answer all questions, submit once, review your result,
          retry if needed, and receive a certificate only after meeting the pass mark.
        </p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <p className="text-slate-500">Pass mark</p>
            <p className="font-semibold text-slate-950">{PASS_MARK}%</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <p className="text-slate-500">Answered</p>
            <p className="font-semibold text-slate-950">
              {answered}/{total}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <p className="text-slate-500">Attempts</p>
            <p className="font-semibold text-slate-950">Unlimited demo retry</p>
          </div>
        </div>
      </div>

      {!certificate ? (
        <label className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-sm font-semibold text-slate-900">Learner name for certificate</span>
          <input
            value={learnerName}
            onChange={(e) => setLearnerName(e.target.value)}
            className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-teal-600/20 focus:ring-4"
          />
        </label>
      ) : null}

      <div className="space-y-3">
        {questions.map((q, idx) => {
          const selected = answers[q.id] ?? null;
          const showResult = submitted && selected != null;
          const correct = showResult && selected === q.correctIndex;
          const wrong = showResult && selected !== q.correctIndex;
          return (
            <article key={q.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Question {idx + 1} - {q.loTag}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950">{q.prompt}</h3>
                </div>
                {showResult ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      correct
                        ? "bg-green-50 text-green-800 ring-green-200"
                        : "bg-amber-50 text-amber-900 ring-amber-200"
                    }`}
                  >
                    {correct ? "Correct" : "Review"}
                  </span>
                ) : null}
              </div>

              <fieldset className="mt-4 grid gap-2" aria-label={q.prompt}>
                {q.options.map((option, optionIndex) => {
                  const isSelected = selected === optionIndex;
                  const isCorrectOption = submitted && optionIndex === q.correctIndex;
                  const isWrongPick = submitted && isSelected && optionIndex !== q.correctIndex;
                  return (
                    <label
                      key={`${q.id}-${optionIndex}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-sm transition ${
                        isCorrectOption
                          ? "border-green-300 bg-green-50"
                          : isWrongPick
                            ? "border-amber-300 bg-amber-50"
                            : isSelected
                              ? "border-teal-300 bg-teal-50"
                              : "border-slate-200 hover:border-teal-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={isSelected}
                        onChange={() => {
                          setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
                          setSubmitted(false);
                        }}
                        className="mt-1"
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </fieldset>

              {wrong ? (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                  Correct answer: {q.options[q.correctIndex ?? 0]}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      {!certificate ? (
        <div className="sticky bottom-20 z-10 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          {submitted ? (
            <div
              className={`mb-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                passed
                  ? "bg-green-50 text-green-800 ring-1 ring-green-200"
                  : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
              }`}
              role="status"
            >
              {passed
                ? `Passed: ${scorePercent}% (${score}/${total}). Your certificate is ready.`
                : `Not passed yet: ${scorePercent}% (${score}/${total}). Review the highlighted answers and retry.`}
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Submit when all questions are answered. Certificate unlocks at {PASS_MARK}%.
            </p>
            <div className="flex gap-2">
              {failed ? (
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Retry assessment
                </button>
              ) : null}
              <button
                type="button"
                disabled={answered < total || submitting}
                onClick={() => void submit()}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Issuing..." : "Submit assessment"}
              </button>
            </div>
          </div>
          {submitError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 ring-1 ring-red-200">
              {submitError}
            </p>
          ) : null}
          {!certificateReady ? (
            <p className="mt-3 text-xs text-slate-500">Checking for an existing certificate...</p>
          ) : null}
        </div>
      ) : (
        <DemoCertificatePanel certificate={certificate} />
      )}
    </section>
  );
}

function DemoCertificatePanel({ certificate }: { certificate: CertificateRecord }) {
  function escapeHtml(value: string | number) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function downloadCertificateHtml() {
    const cpdBadgeUrl = `${window.location.origin}${CPD_BADGE_SRC}`;
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(certificate.courseTitle)} certificate</title>
  <style>
    body{font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:40px}
    .certificate{position:relative;max-width:1040px;margin:auto;overflow:hidden;border:1px solid #d7bd75;background:#fffef8;padding:54px 62px;text-align:center;box-shadow:0 24px 70px rgba(15,23,42,.14)}
    .certificate:before{content:"";position:absolute;inset:18px;border:2px solid #d7bd75;pointer-events:none}
    .top{display:flex;align-items:center;justify-content:space-between;gap:24px;text-align:left}
    .brand{font-size:18px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#083344}
    .badge{display:block;width:188px;max-width:34%;height:auto}
    .eyebrow{margin-top:38px;color:#0f766e;text-transform:uppercase;letter-spacing:.18em;font-weight:900}
    h1{font-size:46px;margin:12px 0 18px}.name{font-size:40px;font-weight:900;color:#0f766e}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:34px;text-align:left}
    .meta div{border-top:1px solid #d7bd75;padding-top:10px}.meta span{display:block;color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase}.meta strong{display:block;margin-top:5px}
    .foot{margin-top:32px;color:#475569;font-size:13px}
  </style>
</head>
<body>
  <section class="certificate">
    <div class="top">
      <div>
        <div class="brand">${escapeHtml(CERTIFICATE_PROVIDER)}</div>
        <div>Continuing professional development record</div>
      </div>
      <img class="badge" src="${escapeHtml(cpdBadgeUrl)}" alt="CPD Certified badge" />
    </div>
    <p class="eyebrow">Certificate of completion</p>
    <h1>${escapeHtml(certificate.courseTitle)}</h1>
    <p>This certifies that</p>
    <p class="name">${escapeHtml(certificate.learnerName)}</p>
    <p>successfully completed and passed this e-learning course.</p>
    <div class="meta">
      <div><span>Issued</span><strong>${escapeHtml(certificate.issuedAt)}</strong></div>
      <div><span>Score</span><strong>${escapeHtml(certificate.scoreLabel)} (${escapeHtml(certificate.scorePercent)}%)</strong></div>
      <div><span>CPD value</span><strong>${escapeHtml(CERTIFICATE_CPD_HOURS)} hours / ${escapeHtml(CERTIFICATE_CPD_POINTS)} points</strong></div>
      <div><span>Certificate ID</span><strong>${escapeHtml(certificate.certificateId)}</strong></div>
    </div>
    <p class="foot">Provider: ${escapeHtml(CERTIFICATE_PROVIDER)} · Level: ${escapeHtml(CERTIFICATE_LEVEL)} · Keep this certificate with your CPD record.</p>
  </section>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certificate.certificateId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-xl border border-teal-200 bg-gradient-to-b from-white to-teal-50 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
            Certificate unlocked
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Course passed
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Export / print PDF
          </button>
          <button
            type="button"
            onClick={downloadCertificateHtml}
            className="rounded-lg border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            Download certificate
          </button>
        </div>
      </div>

      <div className="demo-certificate" id="demo-certificate">
        <div className="demo-certificate-inner">
          <div className="demo-certificate-topline">
            <div className="text-left">
              <p className="demo-certificate-brand">{CERTIFICATE_PROVIDER}</p>
              <p className="demo-certificate-subtitle">Continuing professional development record</p>
            </div>
            <img className="demo-cpd-badge" src={CPD_BADGE_SRC} alt="CPD Certified badge" />
          </div>

          <p className="demo-certificate-eyebrow">Certificate of completion</p>
          <h3>{certificate.courseTitle}</h3>
          <p className="demo-certificate-copy">This certifies that</p>
          <p className="demo-certificate-name">{certificate.learnerName}</p>
          <p className="demo-certificate-copy">
            successfully completed and passed this e-learning course.
          </p>
          <dl>
            <div>
              <dt>Issued</dt>
              <dd>{certificate.issuedAt}</dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>
                {certificate.scoreLabel} ({certificate.scorePercent}%)
              </dd>
            </div>
            <div>
              <dt>CPD value</dt>
              <dd>
                {CERTIFICATE_CPD_HOURS} hours / {CERTIFICATE_CPD_POINTS} points
              </dd>
            </div>
            <div>
              <dt>Level</dt>
              <dd>{CERTIFICATE_LEVEL}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt>Certificate ID</dt>
              <dd>{certificate.certificateId}</dd>
            </div>
          </dl>
          <p className="demo-certificate-footer">
            Keep this certificate with your CPD record. Issued by {CERTIFICATE_PROVIDER}.
          </p>
        </div>
      </div>
    </section>
  );
}
