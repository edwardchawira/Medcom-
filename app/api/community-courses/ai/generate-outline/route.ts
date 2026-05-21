import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { orchestrateOutlineGeneration } from "@/lib/ai/generationOrchestrator";
import { generateOutlineRequestSchema } from "@/lib/courseBuilder/types";

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

  const parsed = generateOutlineRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const outline = await orchestrateOutlineGeneration(parsed.data);
  return NextResponse.json({ outline }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
