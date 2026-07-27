import { NextResponse } from "next/server";
import { z } from "zod";
import { checkSameOrigin, safeError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().min(1),
      })
    )
    .min(1)
    .max(80),
});

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { error } = await supabase.rpc("reorder_community_course_lesson_blocks", {
    p_items: parsed.data.items,
  });
  if (error) {
    console.error("Lesson block reorder failed", error);
    const status = /forbidden|not found|sign in/i.test(error.message) ? 403 : 400;
    return safeError("Could not reorder lesson blocks.", status);
  }

  return NextResponse.json({ ok: true });
}
