import { NextResponse } from "next/server";
import { safeError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    "there";

  const { data: rows, error } = await supabase
    .from("user_course_progress")
    .select("course_key, course_title, status, progress, resume_path, updated_at, completed_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Dashboard progress lookup failed", error);
    return safeError("Could not load dashboard.", 500);
  }

  const { count: certificatesCount, error: certificateError } = await supabase
    .from("user_course_certificates")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (certificateError) {
    console.error("Dashboard certificate count failed", certificateError);
  }

  const inProgress = (rows ?? []).filter((r) => r.status === "in_progress");
  const continueCourse = inProgress[0] ?? null;

  const recentActivity = (rows ?? []).slice(0, 5).map((r) => {
    const kind = r.status === "completed" ? "completed" : "started";
    return {
      kind,
      title: r.course_title,
      updatedAt: r.updated_at,
      badge: r.status === "completed" ? "+ Certificate" : "In Progress",
    };
  });

  return NextResponse.json({
    user: { fullName },
    certificatesCount: certificatesCount ?? (rows ?? []).filter((r) => r.status === "completed").length,
    continueCourse: continueCourse
      ? {
          title: continueCourse.course_title,
          progress: continueCourse.progress,
          resumePath: continueCourse.resume_path || "/my-learning",
        }
      : null,
    recentActivity,
  });
}
