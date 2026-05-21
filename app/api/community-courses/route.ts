import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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

type ChapterInput = {
  title: string;
  content: string;
  blocks?: {
    block_type: "text" | "image" | "quiz";
    content_json: Record<string, unknown>;
    source?: "manual" | "ai";
    status?: "draft" | "published" | "archived";
  }[];
  questions?: {
    prompt: string;
    options: string[];
    correctIndex?: number | null;
    explanation?: string;
  }[];
};

type CreateBody = {
  title: string;
  slug?: string;
  category?: string;
  audience?: string[];
  collections?: string[];
  duration?: string;
  thumbnail?: string;
  featured?: boolean;
  published?: boolean;
  learning_outcomes?: string[];
  assessment_html?: string;
  chapters: ChapterInput[];
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title || title.length > 300) {
    return NextResponse.json({ error: "Title is required (max 300 characters)." }, { status: 400 });
  }

  const chaptersIn = Array.isArray(body.chapters) ? body.chapters : [];
  if (chaptersIn.length < 1) {
    return NextResponse.json(
      { error: "Add at least one chapter with title and content." },
      { status: 400 }
    );
  }

  for (let i = 0; i < chaptersIn.length; i++) {
    const ch = chaptersIn[i];
    if (!ch.title?.trim() || !ch.content?.trim()) {
      return NextResponse.json(
        { error: `Chapter ${i + 1} needs a title and content.` },
        { status: 400 }
      );
    }
  }

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

  const learningOutcomes = Array.isArray(body.learning_outcomes)
    ? body.learning_outcomes.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const audience =
    Array.isArray(body.audience) && body.audience.length > 0
      ? body.audience
      : ["Care Assistant", "Other staff"];

  const collections = Array.isArray(body.collections) ? body.collections : [];

  const { data: course, error: insertErr } = await supabase
    .from("community_courses")
    .insert({
      slug,
      title,
      category: (body.category ?? "Community").trim() || "Community",
      audience,
      collections,
      duration: (body.duration ?? "Self-paced").trim() || "Self-paced",
      thumbnail: (body.thumbnail ?? "/images/courses/cover-medication.png").trim(),
      featured: body.featured !== false,
      published: body.published !== false,
      learning_outcomes: learningOutcomes,
      assessment_html: body.assessment_html ?? "",
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (insertErr || !course) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Could not create course." },
      { status: 500 }
    );
  }

  const chapterRows = chaptersIn.map((ch, idx) => ({
    course_id: course.id,
    sort_order: idx + 1,
    title: ch.title.trim(),
    html: "",
    content_md: ch.content.trim(),
  }));

  const { data: insertedChapters, error: chErr } = await supabase
    .from("community_course_chapters")
    .insert(chapterRows)
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (chErr) {
    await supabase.from("community_courses").delete().eq("id", course.id);
    return NextResponse.json({ error: chErr.message }, { status: 500 });
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
    const qs = Array.isArray(ch.questions) ? ch.questions : [];
    for (let qIdx = 0; qIdx < qs.length; qIdx++) {
      const q = qs[qIdx];
      const prompt = (q.prompt ?? "").trim();
      const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [];
      if (!prompt || options.length < 2) continue;
      const ci = typeof q.correctIndex === "number" && Number.isInteger(q.correctIndex) ? q.correctIndex : null;
      if (ci != null && (ci < 0 || ci >= options.length)) {
        return NextResponse.json(
          {
            error: `Question ${qIdx + 1} in chapter ${idx + 1} has a correct answer outside the options list.`,
          },
          { status: 400 }
        );
      }
      questionRows.push({
        chapter_id: chapterId,
        sort_order: qIdx + 1,
        prompt,
        options,
        correct_index: ci,
        explanation: (q.explanation ?? "").trim(),
      });
    }
  }

  if (questionRows.length > 0) {
    const { error: qErr } = await supabase.from("community_chapter_questions").insert(questionRows);
    if (qErr) {
      await supabase.from("community_courses").delete().eq("id", course.id);
      return NextResponse.json({ error: qErr.message }, { status: 500 });
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
    const blocks = Array.isArray(ch.blocks) ? ch.blocks : [];
    blocks.forEach((block, blockIdx) => {
      if (!block?.block_type || !block?.content_json) return;
      blockRows.push({
        chapter_id: chapterId,
        sort_order: blockIdx + 1,
        block_type: block.block_type,
        content_json: block.content_json,
        source: block.source === "ai" ? "ai" : "manual",
        status: block.status ?? "draft",
        created_by: user.id,
      });
    });
  });

  if (blockRows.length > 0) {
    const { error: blockErr } = await supabase.from("community_course_lesson_blocks").insert(blockRows);
    if (blockErr) {
      await supabase.from("community_courses").delete().eq("id", course.id);
      return NextResponse.json({ error: blockErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ slug: course.slug, id: course.id });
}
