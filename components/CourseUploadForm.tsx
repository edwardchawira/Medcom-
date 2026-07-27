"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { uploadCourseThumbnail } from "@/lib/courseThumbnailUpload";
import { uploadCourseMedia } from "@/lib/courseMediaUpload";
import { STOCK_COURSE_COVERS } from "@/lib/stockCourseCovers";
import { slugifyTitle } from "@/lib/slug";
import { MarkdownContent } from "@/components/MarkdownContent";

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

type ChapterQuestionField = {
  prompt: string;
  options: string[];
  correctIndex: number | null;
  explanation: string;
};

type ChapterField = { title: string; content: string; questions: ChapterQuestionField[] };

export function CourseUploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Community");
  const [duration, setDuration] = useState("Self-paced");
  const [thumbnail, setThumbnail] = useState("/images/courses/cover-medication.png");
  const [featured, setFeatured] = useState(true);
  const [audienceSel, setAudienceSel] = useState<string[]>(["Care Assistant", "Other staff"]);
  const [outcomesText, setOutcomesText] = useState("");
  const [assessmentHtml, setAssessmentHtml] = useState(
    "## Final assessment\n\nAnswer the questions, then submit your answers.\n\n- Aim for 80%+ before finishing.\n- Take your time — accuracy matters more than speed.\n"
  );
  const [chapters, setChapters] = useState<ChapterField[]>([
    {
      title: "Introduction",
      content: "Welcome to this course.\n\nUse short paragraphs and bullet points.\n",
      questions: [
        {
          prompt: "What should you do after reading a chapter?",
          options: ["Skip the questions", "Check your understanding with the questions"],
          correctIndex: 1,
          explanation: "Each chapter ends with quick questions so learners can confirm understanding.",
        },
      ],
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chapterTextRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const chapterImageInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const chapterVideoInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [uploadingChapterMedia, setUploadingChapterMedia] = useState(false);
  const [chapterMediaError, setChapterMediaError] = useState<string | null>(null);
  const [chapterEditorTab, setChapterEditorTab] = useState<Record<number, "write" | "preview">>({});

  const slugPreview = useMemo(() => {
    const raw = slug.trim();
    return raw ? slugifyTitle(raw) : slugifyTitle(title);
  }, [slug, title]);

  function toggleAudience(a: string) {
    setAudienceSel((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function addChapter() {
    setChapters((prev) => [
      ...prev,
      { title: "", content: "", questions: [{ prompt: "", options: ["", ""], correctIndex: null, explanation: "" }] },
    ]);
  }

  function removeChapter(i: number) {
    setChapters((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateChapter(i: number, patch: Partial<ChapterField>) {
    setChapters((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function insertAtCursor(chIdx: number, text: string) {
    const el = chapterTextRefs.current[chIdx];
    if (!el) {
      updateChapter(chIdx, { content: (chapters[chIdx]?.content ?? "") + text });
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? start;
    const current = chapters[chIdx]?.content ?? "";
    const next = current.slice(0, start) + text + current.slice(end);
    updateChapter(chIdx, { content: next });
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + text.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function onChapterImageFile(chIdx: number, file: File | null) {
    if (!file) return;
    setChapterMediaError(null);
    setUploadingChapterMedia(true);
    try {
      const url = await uploadCourseMedia(file, "image");
      insertAtCursor(chIdx, `\n\n![](${url})\n\n`);
      setChapterEditorTab((prev) => ({ ...prev, [chIdx]: "write" }));
    } catch (err) {
      setChapterMediaError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploadingChapterMedia(false);
    }
  }

  async function onChapterVideoFile(chIdx: number, file: File | null) {
    if (!file) return;
    setChapterMediaError(null);
    setUploadingChapterMedia(true);
    try {
      const url = await uploadCourseMedia(file, "video");
      insertAtCursor(chIdx, `\n\n::video()(${url})\n\n`);
      setChapterEditorTab((prev) => ({ ...prev, [chIdx]: "write" }));
    } catch (err) {
      setChapterMediaError(err instanceof Error ? err.message : "Could not upload video.");
    } finally {
      setUploadingChapterMedia(false);
    }
  }

  function addQuestion(chIdx: number) {
    setChapters((prev) =>
      prev.map((c, i) =>
        i === chIdx
          ? {
              ...c,
              questions: [
                ...c.questions,
                { prompt: "", options: ["", ""], correctIndex: null, explanation: "" },
              ],
            }
          : c
      )
    );
  }

  function removeQuestion(chIdx: number, qIdx: number) {
    setChapters((prev) =>
      prev.map((c, i) =>
        i === chIdx ? { ...c, questions: c.questions.filter((_, j) => j !== qIdx) } : c
      )
    );
  }

  function updateQuestion(
    chIdx: number,
    qIdx: number,
    patch: Partial<ChapterQuestionField>
  ) {
    setChapters((prev) =>
      prev.map((c, i) => {
        if (i !== chIdx) return c;
        return {
          ...c,
          questions: c.questions.map((q, j) => (j === qIdx ? { ...q, ...patch } : q)),
        };
      })
    );
  }

  function updateQuestionOption(chIdx: number, qIdx: number, optIdx: number, value: string) {
    setChapters((prev) =>
      prev.map((c, i) => {
        if (i !== chIdx) return c;
        return {
          ...c,
          questions: c.questions.map((q, j) => {
            if (j !== qIdx) return q;
            const nextOpts = [...q.options];
            nextOpts[optIdx] = value;
            return { ...q, options: nextOpts };
          }),
        };
      })
    );
  }

  function addOption(chIdx: number, qIdx: number) {
    setChapters((prev) =>
      prev.map((c, i) => {
        if (i !== chIdx) return c;
        return {
          ...c,
          questions: c.questions.map((q, j) =>
            j === qIdx ? { ...q, options: [...q.options, ""] } : q
          ),
        };
      })
    );
  }

  async function onThumbnailFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setThumbUploadError(null);
    setUploadingThumb(true);
    try {
      const url = await uploadCourseThumbnail(file);
      setThumbnail(url);
    } catch (err) {
      setThumbUploadError(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploadingThumb(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const learning_outcomes = outcomesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/community-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug.trim() || undefined,
          category,
          audience: audienceSel.length ? audienceSel : ["Other staff"],
          duration,
          thumbnail: thumbnail.trim() || "/images/courses/cover-medication.png",
          featured,
          learning_outcomes,
          assessment_html: assessmentHtml,
          chapters: chapters.map((c) => ({
            title: c.title,
            content: c.content,
            questions: c.questions.map((q) => ({
              prompt: q.prompt,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
            })),
          })),
        }),
      });
      const json = (await res.json()) as { error?: string; slug?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not save course draft.");
        return;
      }
      if (json.slug) {
        router.push(`/courses/community/${json.slug}/overview`);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteNav activeOverride="/courses" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <nav className="text-sm text-slate-500 mb-4" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-teal-600">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/courses" className="hover:text-teal-600">
            Courses
          </Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Upload a course</span>
        </nav>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">Upload a course</h1>
        <p className="text-slate-600 mb-8">
          Saved drafts are available to you for review before they appear in the catalog. Write chapters
          in simple text (supports basic formatting like headings, bullet points, and links). Add the
          questionnaire with the form below — no HTML required.
        </p>

        <form onSubmit={onSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1" htmlFor="course-title">
              Course title
            </label>
            <input
              id="course-title"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={300}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1" htmlFor="course-slug">
              URL slug (optional)
            </label>
            <input
              id="course-slug"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto from title"
            />
            <p className="text-xs text-slate-500 mt-1">Will be: /courses/community/{slugPreview}/…</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1" htmlFor="course-cat">
                Category
              </label>
              <select
                id="course-cat"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1" htmlFor="course-dur">
                Duration label
              </label>
              <input
                id="course-dur"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Course cover</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Upload your own image (stored in your Medcom workspace) or pick a stock cover.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative h-36 w-full sm:w-52 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <Image
                  src={thumbnail}
                  alt="Course cover preview"
                  fill
                  className="object-cover transition-opacity duration-200"
                  sizes="208px"
                  unoptimized
                />
                {uploadingThumb ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-slate-700">
                    Uploading…
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  aria-hidden
                  onChange={onThumbnailFile}
                />
                <button
                  type="button"
                  disabled={uploadingThumb}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-teal-600 bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50 active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                  <i className="fas fa-cloud-arrow-up mr-2" aria-hidden />
                  Upload image
                </button>
                <p className="text-xs text-slate-500">JPEG, PNG, WebP, or GIF · up to 5 MB</p>
                {thumbUploadError ? (
                  <p className="text-xs text-red-700">{thumbUploadError}</p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Stock covers
              </p>
              <div className="flex flex-wrap gap-2">
                {STOCK_COURSE_COVERS.map(({ path, label }) => {
                  const selected = thumbnail === path;
                  return (
                    <button
                      key={path}
                      type="button"
                      title={label}
                      onClick={() => {
                        setThumbnail(path);
                        setThumbUploadError(null);
                      }}
                      className={`relative h-14 w-20 overflow-hidden rounded-md border-2 transition-all duration-150 hover:ring-2 hover:ring-teal-400/60 hover:ring-offset-1 ${
                        selected ? "border-teal-600 ring-2 ring-teal-500/40" : "border-slate-200"
                      }`}
                    >
                      <Image src={path} alt="" fill className="object-cover" sizes="80px" unoptimized />
                    </button>
                  );
                })}
              </div>
            </div>

            <details className="group">
              <summary className="cursor-pointer text-sm text-teal-800 hover:text-teal-950 font-medium list-none flex items-center gap-2 [&::-webkit-details-marker]:hidden">
                <i className="fas fa-chevron-right text-xs transition-transform group-open:rotate-90" aria-hidden />
                Custom image URL
              </summary>
              <div className="mt-2 pl-5">
                <label className="sr-only" htmlFor="course-thumb-url">
                  Custom thumbnail URL
                </label>
                <input
                  id="course-thumb-url"
                  type="url"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white"
                  placeholder="https://…"
                  value={thumbnail.startsWith("http") ? thumbnail : ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (!v) {
                      setThumbnail("/images/courses/cover-medication.png");
                      return;
                    }
                    setThumbnail(v);
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Optional. Use a direct link to an image, or upload / choose stock above.
                </p>
              </div>
            </details>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-800 mb-2">Audience</legend>
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <label key={a} className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={audienceSel.includes(a)}
                    onChange={() => toggleAudience(a)}
                  />
                  {a}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="inline-flex items-center gap-2 text-sm text-slate-800">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Feature in &quot;Recommended for you&quot;
          </label>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1" htmlFor="outcomes">
              Learning outcomes (one per line)
            </label>
            <textarea
              id="outcomes"
              className="w-full min-h-[88px] rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              value={outcomesText}
              onChange={(e) => setOutcomesText(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">Chapters</h2>
              <button
                type="button"
                onClick={addChapter}
                className="text-sm font-medium text-teal-700 hover:text-teal-900"
              >
                + Add chapter
              </button>
            </div>
            {chapters.map((ch, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">Chapter {i + 1}</span>
                  {chapters.length > 1 ? (
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-800"
                      onClick={() => removeChapter(i)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  placeholder="Chapter title"
                  value={ch.title}
                  onChange={(e) => updateChapter(i, { title: e.target.value })}
                />
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChapterEditorTab((prev) => ({ ...prev, [i]: "write" }))}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          (chapterEditorTab[i] ?? "write") === "write"
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-transparent border-transparent text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setChapterEditorTab((prev) => ({ ...prev, [i]: "preview" }))}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
                          (chapterEditorTab[i] ?? "write") === "preview"
                            ? "bg-white border-slate-300 text-slate-900"
                            : "bg-transparent border-transparent text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Preview
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={(el) => {
                          chapterImageInputRefs.current[i] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          e.target.value = "";
                          void onChapterImageFile(i, f);
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingChapterMedia}
                        onClick={() => chapterImageInputRefs.current[i]?.click()}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <i className="fas fa-image" aria-hidden />
                        Insert image
                      </button>

                      <input
                        ref={(el) => {
                          chapterVideoInputRefs.current[i] = el;
                        }}
                        type="file"
                        accept="video/mp4,video/webm"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          e.target.value = "";
                          void onChapterVideoFile(i, f);
                        }}
                      />
                      <button
                        type="button"
                        disabled={uploadingChapterMedia}
                        onClick={() => chapterVideoInputRefs.current[i]?.click()}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <i className="fas fa-video" aria-hidden />
                        Insert video
                      </button>
                    </div>
                  </div>

                  {(chapterEditorTab[i] ?? "write") === "write" ? (
                    <textarea
                      ref={(el) => {
                        chapterTextRefs.current[i] = el;
                      }}
                      required
                      className="w-full min-h-[180px] px-3 py-3 text-sm text-slate-900 outline-none"
                      placeholder="Write your chapter content (simple text, headings, bullets). Use the buttons above to insert images/videos."
                      value={ch.content}
                      onChange={(e) => updateChapter(i, { content: e.target.value })}
                    />
                  ) : (
                    <div className="p-4 bg-white">
                      <div className="learning-content">
                        <MarkdownContent markdown={ch.content} />
                      </div>
                    </div>
                  )}
                </div>

                {chapterMediaError ? (
                  <p className="text-xs text-red-700">{chapterMediaError}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Tip: videos are inserted as <code className="bg-slate-100 px-1 rounded">::video()(url)</code>.
                  </p>
                )}

                <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/60 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-teal-900">
                      Check your understanding (questionnaire)
                    </p>
                    <button
                      type="button"
                      onClick={() => addQuestion(i)}
                      className="text-sm font-semibold text-teal-800 hover:text-teal-950"
                    >
                      + Add question
                    </button>
                  </div>

                  {ch.questions.map((q, qi) => (
                    <div key={qi} className="rounded-lg border border-teal-100 bg-white p-3 space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          Question {qi + 1}
                        </p>
                        {ch.questions.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeQuestion(i, qi)}
                            className="text-xs font-semibold text-rose-700 hover:text-rose-900"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <input
                        type="text"
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        placeholder="Question prompt"
                        value={q.prompt}
                        onChange={(e) => updateQuestion(i, qi, { prompt: e.target.value })}
                      />
                      <div className="space-y-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${i}-${qi}`}
                              checked={q.correctIndex === oi}
                              onChange={() => updateQuestion(i, qi, { correctIndex: oi })}
                              aria-label={`Mark option ${oi + 1} as correct`}
                            />
                            <input
                              type="text"
                              required
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={(e) => updateQuestionOption(i, qi, oi, e.target.value)}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(i, qi)}
                          className="text-xs font-semibold text-teal-800 hover:text-teal-950"
                        >
                          + Add option
                        </button>
                      </div>
                      <textarea
                        className="w-full min-h-[64px] rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                        placeholder="Explanation shown after answering (optional)"
                        value={q.explanation}
                        onChange={(e) => updateQuestion(i, qi, { explanation: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1" htmlFor="assessment">
              Assessment HTML
            </label>
            <textarea
              id="assessment"
              className="w-full min-h-[140px] rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900"
              value={assessmentHtml}
              onChange={(e) => setAssessmentHtml(e.target.value)}
            />
          </div>

          {error ? (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting || uploadingThumb}
              className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-white font-semibold shadow-sm hover:bg-teal-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save draft"}
            </button>
            <Link
              href="/courses"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 text-slate-800 font-medium hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
