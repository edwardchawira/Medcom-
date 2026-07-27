import { NextResponse } from "next/server";
import { safeError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course, error: courseError } = await supabase
    .from("community_courses")
    .select("id, slug, title, learning_outcomes, assessment_html, published, created_by")
    .eq("slug", slug)
    .maybeSingle();

  if (courseError) {
    console.error("Community course preview lookup failed", courseError);
    return safeError("Could not load the course preview.", 500);
  }
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (!course.published && course.created_by !== user?.id) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const { data: chapters, error: chapterError } = await supabase
    .from("community_course_chapters")
    .select("id, title, sort_order, content_md")
    .eq("course_id", course.id)
    .order("sort_order", { ascending: true });

  if (chapterError) {
    console.error("Community course preview chapters failed", chapterError);
    return safeError("Could not load the course chapters.", 500);
  }

  const chapterIds = (chapters ?? []).map((chapter) => chapter.id);
  let blocks: unknown[] = [];

  if (chapterIds.length > 0) {
    const { data: fetchedBlocks } = await supabase
      .from("community_course_lesson_blocks")
      .select("id, chapter_id, sort_order, block_type, content_json, source, status")
      .in("chapter_id", chapterIds)
      .order("sort_order", { ascending: true });
    blocks = fetchedBlocks ?? [];
  }

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      learning_outcomes: course.learning_outcomes,
      assessment_html: course.assessment_html,
    },
    chapters: chapters ?? [],
    blocks,
  });
}
