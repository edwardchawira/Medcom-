import { NextResponse } from "next/server";
import { z } from "zod";
import { checkSameOrigin, safeError } from "@/lib/api/security";
import { contentBlockPayloadSchema } from "@/lib/courseBuilder/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugifyTitle } from "@/lib/slug";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("community_courses")
    .select(
      `id, slug, title, category, audience, collections, duration, thumbnail, featured, community_course_chapters ( id )`
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Community courses list failed", error);
    return safeError("Could not load courses.", 500);
  }

  const courses = (rows ?? []).map((r) => {
    const ch = r.community_course_chapters;
    const chapterCount = Array.isArray(ch) ? ch.length : 0;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      category: r.category,
      audience: r.audience,
      collections: r.collections,
      duration: r.duration,
      thumbnail: r.thumbnail,
      featured: r.featured,
      chapters: chapterCount,
    };
  });

  return NextResponse.json({ courses });
}

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional();

const createBlockSchema = z
  .object({
    block_type: z.enum(["text", "image", "quiz"]),
    content_json: contentBlockPayloadSchema,
    source: z.enum(["manual", "ai"]).optional().default("manual"),
    status: z.enum(["draft", "published", "archived"]).optional().default("draft"),
  })
  .refine((block) => block.block_type === block.content_json.kind, {
    message: "Block type must match content kind.",
    path: ["content_json"],
  });

const createQuestionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(1200),
    options: z.array(z.string().trim().min(1).max(300)).min(2).max(8),
    correctIndex: z.number().int().min(0).nullable().optional(),
    explanation: z.string().trim().max(2000).optional().default(""),
  })
  .refine((question) => question.correctIndex == null || question.correctIndex < question.options.length, {
    message: "Correct answer must be inside the options list.",
    path: ["correctIndex"],
  });

const createChapterSchema = z.object({
  title: z.string().trim().min(1).max(240),
  content: z.string().trim().min(1).max(60000),
  blocks: z.array(createBlockSchema).max(80).optional().default([]),
  questions: z.array(createQuestionSchema).max(40).optional().default([]),
});

const createCourseSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: optionalTrimmedString(300),
  category: optionalTrimmedString(120),
  audience: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  collections: z.array(z.string().trim().min(1).max(80)).max(20).optional().default([]),
  duration: optionalTrimmedString(120),
  thumbnail: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => value.startsWith("/") || /^https:\/\/[^ ]+$/i.test(value), {
      message: "Thumbnail must be a site path or HTTPS URL.",
    })
    .optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional().default(false),
  learning_outcomes: z.array(z.string().trim().min(1).max(300)).max(20).optional().default([]),
  assessment_html: z.string().max(20000).optional().default(""),
  chapters: z.array(createChapterSchema).min(1).max(40),
});

type CreateBody = z.infer<typeof createCourseSchema>;

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createCourseSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body: CreateBody = parsed.data;
  const title = body.title;
  const chaptersIn = body.chapters;

  const rawSlug = (body.slug ?? "").trim();
  const slug = rawSlug ? slugifyTitle(rawSlug) : slugifyTitle(title);

  const { data: clash } = await supabase
    .from("community_courses")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) {
    return NextResponse.json(
      { error: "That URL slug is already in use. Change the title or slug." },
      { status: 409 }
    );
  }

  const learningOutcomes = body.learning_outcomes;

  const audience = body.audience.length > 0 ? body.audience : ["Care Assistant", "Other staff"];

  const collections = body.collections;
  const { data: course, error: insertErr } = await supabase
    .from("community_courses")
    .insert({
      slug,
      title,
      category: body.category || "Community",
      audience,
      collections,
      duration: body.duration || "Self-paced",
      thumbnail: body.thumbnail || "/images/courses/cover-medication.png",
      featured: body.featured !== false,
      published: false,
      learning_outcomes: learningOutcomes,
      assessment_html: body.assessment_html,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (insertErr || !course) {
    console.error("Community course insert failed", insertErr);
    return safeError("Could not create course.", 500);
  }

  const chapterRows = chaptersIn.map((ch, idx) => ({
    course_id: course.id,
    sort_order: idx + 1,
    title: ch.title,
    html: "",
    content_md: ch.content,
  }));

  const { data: insertedChapters, error: chErr } = await supabase
    .from("community_course_chapters")
    .insert(chapterRows)
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (chErr) {
    await supabase.from("community_courses").delete().eq("id", course.id);
    console.error("Community course chapters insert failed", chErr);
    return safeError("Could not create course chapters.", 500);
  }

  const chByOrder = new Map<number, string>();
  (insertedChapters ?? []).forEach((c) => chByOrder.set(c.sort_order, c.id));

  const questionRows: {
    chapter_id: string;
    sort_order: number;
    prompt: string;
    options: string[];
    correct_index: number | null;
    explanation: string;
  }[] = [];

  for (let idx = 0; idx < chaptersIn.length; idx++) {
    const ch = chaptersIn[idx];
    const chapterId = chByOrder.get(idx + 1);
    if (!chapterId) continue;
    const qs = ch.questions;
    for (let qIdx = 0; qIdx < qs.length; qIdx++) {
      const q = qs[qIdx];
      questionRows.push({
        chapter_id: chapterId,
        sort_order: qIdx + 1,
        prompt: q.prompt,
        options: q.options,
        correct_index: q.correctIndex ?? null,
        explanation: q.explanation,
      });
    }
  }

  if (questionRows.length > 0) {
    const { error: qErr } = await supabase.from("community_chapter_questions").insert(questionRows);
    if (qErr) {
      await supabase.from("community_courses").delete().eq("id", course.id);
      console.error("Community course questions insert failed", qErr);
      return safeError("Could not create course questions.", 500);
    }
  }

  const blockRows: {
    chapter_id: string;
    sort_order: number;
    block_type: "text" | "image" | "quiz";
    content_json: Record<string, unknown>;
    source: "manual" | "ai";
    status: "draft" | "published" | "archived";
    created_by: string;
  }[] = [];

  chaptersIn.forEach((ch, idx) => {
    const chapterId = chByOrder.get(idx + 1);
    if (!chapterId) return;
    const blocks = ch.blocks;
    blocks.forEach((block, blockIdx) => {
      blockRows.push({
        chapter_id: chapterId,
        sort_order: blockIdx + 1,
        block_type: block.block_type,
        content_json: block.content_json,
        source: block.source,
        status: block.status,
        created_by: user.id,
      });
    });
  });

  if (blockRows.length > 0) {
    const { error: blockErr } = await supabase.from("community_course_lesson_blocks").insert(blockRows);
    if (blockErr) {
      await supabase.from("community_courses").delete().eq("id", course.id);
      console.error("Community course blocks insert failed", blockErr);
      return safeError("Could not create course learning blocks.", 500);
    }
  }

  return NextResponse.json({ slug: course.slug, id: course.id });
}
