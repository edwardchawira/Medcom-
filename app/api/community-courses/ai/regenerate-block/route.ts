import { NextResponse } from "next/server";
import {
  checkRateLimit,
  checkSameOrigin,
  getClientIp,
  rateLimitResponse,
  requireUser,
  safeError,
} from "@/lib/api/security";
import { orchestrateBlockGeneration } from "@/lib/ai/generationOrchestrator";
import { regenerateBlockRequestSchema } from "@/lib/courseBuilder/types";

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const { supabase, user } = await requireUser();

  if (!user) {
    return safeError("Sign in required", 401);
  }

  const limited = checkRateLimit({
    key: `ai:regenerate:${user.id}:${getClientIp(req)}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return rateLimitResponse(limited.resetAt);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return safeError("Invalid JSON body", 400);
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
    console.error("Block lookup failed", blockError);
    return safeError("Could not load the lesson block.", 500);
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
    console.error("Block update failed", updateError);
    return safeError("Could not update the lesson block.", 500);
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
    console.error("Block version insert failed", versionError);
    return safeError("Could not save the block version.", 500);
  }

  return NextResponse.json({ block: payload, version: nextVersion }, { status: 200 });
}
