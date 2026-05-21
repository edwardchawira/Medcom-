import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { orchestrateBlockGeneration } from "@/lib/ai/generationOrchestrator";
import { regenerateBlockRequestSchema } from "@/lib/courseBuilder/types";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = regenerateBlockRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: block, error: blockError } = await supabase
    .from("community_course_lesson_blocks")
    .select("id, created_by")
    .eq("id", parsed.data.blockId)
    .maybeSingle();

  if (blockError) {
    return NextResponse.json({ error: blockError.message }, { status: 500 });
  }
  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }
  if (block.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await orchestrateBlockGeneration({
    blockType: parsed.data.blockType,
    chapterTitle: parsed.data.chapterTitle,
    courseTitle: parsed.data.courseTitle,
    prompt: parsed.data.prompt,
    contextMarkdown: parsed.data.contextMarkdown,
  });

  const { data: existingVersion } = await supabase
    .from("community_course_block_versions")
    .select("version_no")
    .eq("block_id", parsed.data.blockId)
    .order("version_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (existingVersion?.version_no ?? 0) + 1;

  const { data: updatedBlock, error: updateError } = await supabase
    .from("community_course_lesson_blocks")
    .update({ content_json: payload, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.blockId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  if (!updatedBlock) {
    return NextResponse.json({ error: "Block was not updated" }, { status: 403 });
  }

  const { error: versionError } = await supabase.from("community_course_block_versions").insert({
    block_id: parsed.data.blockId,
    version_no: nextVersion,
    content_json: payload,
    prompt: parsed.data.prompt,
    model: "gpt-4o-mini",
    created_by: user.id,
  });
  if (versionError) {
    return NextResponse.json({ error: versionError.message }, { status: 500 });
  }

  return NextResponse.json({ block: payload, version: nextVersion }, { status: 200 });
}
