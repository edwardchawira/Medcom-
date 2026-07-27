import { NextResponse } from "next/server";
import { checkSameOrigin, safeError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { contentBlockPayloadSchema } from "@/lib/courseBuilder/types";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const { blockId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let body: { payload?: unknown; status?: "draft" | "published" | "archived" };
  try {
    body = (await req.json()) as { payload?: unknown; status?: "draft" | "published" | "archived" };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.payload) {
    const parsed = contentBlockPayloadSchema.safeParse(body.payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    patch.content_json = parsed.data;
  }
  if (body.status) {
    patch.status = body.status;
  }
  patch.updated_at = new Date().toISOString();

  const { data: updatedBlock, error } = await supabase
    .from("community_course_lesson_blocks")
    .update(patch)
    .eq("id", blockId)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Lesson block update failed", error);
    return safeError("Could not update the lesson block.", 500);
  }
  if (!updatedBlock) {
    return NextResponse.json({ error: "Block not found or forbidden" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const { blockId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: deletedBlock, error } = await supabase
    .from("community_course_lesson_blocks")
    .delete()
    .eq("id", blockId)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("Lesson block delete failed", error);
    return safeError("Could not delete the lesson block.", 500);
  }
  if (!deletedBlock) {
    return NextResponse.json({ error: "Block not found or forbidden" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
