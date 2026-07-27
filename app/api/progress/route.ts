import { NextResponse } from "next/server";
import { checkSameOrigin, safeError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Body = {
  courseKey: string;
  courseTitle: string;
  status: "in_progress" | "completed";
  progress: number;
  resumePath: string;
};

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const courseKey = String(body.courseKey ?? "").trim();
  const courseTitle = String(body.courseTitle ?? "").trim();
  const resumePath = String(body.resumePath ?? "").trim();

  if (!courseKey || !courseTitle || !resumePath) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const progress = Math.max(0, Math.min(100, Math.round(Number(body.progress ?? 0))));
  const status = body.status === "completed" ? "completed" : "in_progress";

  const now = new Date().toISOString();

  const { error } = await supabase.from("user_course_progress").upsert(
    {
      user_id: user.id,
      course_key: courseKey,
      course_title: courseTitle,
      status,
      progress,
      resume_path: resumePath,
      updated_at: now,
      completed_at: status === "completed" ? now : null,
    },
    { onConflict: "user_id,course_key" }
  );

  if (error) {
    console.error("Course progress upsert failed", error);
    return safeError("Could not save course progress.", 500);
  }

  return NextResponse.json({ ok: true });
}
