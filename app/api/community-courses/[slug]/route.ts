import { NextResponse } from "next/server";
import { checkSameOrigin, safeError } from "@/lib/api/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { data: course, error: courseErr } = await supabase
    .from("community_courses")
    .select("id, created_by")
    .eq("slug", slug)
    .maybeSingle();

  if (courseErr) {
    console.error("Community course lookup failed", courseErr);
    return safeError("Could not load the course.", 500);
  }
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (course.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: delErr } = await supabase
    .from("community_courses")
    .delete()
    .eq("id", course.id);

  if (delErr) {
    console.error("Community course delete failed", delErr);
    return safeError("Could not delete the course.", 500);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
