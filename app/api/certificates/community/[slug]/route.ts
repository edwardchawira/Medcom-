import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkRateLimit,
  checkSameOrigin,
  getClientIp,
  rateLimitResponse,
  requireUser,
  safeError,
} from "@/lib/api/security";

const PASS_MARK = 80;

const issueCertificateSchema = z.object({
  learnerName: z.string().trim().min(1).max(120),
  answers: z.record(z.string(), z.number().int().min(0)),
});

type Props = { params: Promise<{ slug: string }> };

type CertificateRow = {
  learner_name: string;
  course_title: string;
  issued_at: string;
  score_percent: number;
  score_label: string;
  certificate_id: string;
};

function certificateResponse(row: CertificateRow) {
  return {
    learnerName: row.learner_name,
    courseTitle: row.course_title,
    issuedAt: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Europe/London",
    }).format(new Date(row.issued_at)),
    scorePercent: row.score_percent,
    scoreLabel: row.score_label,
    certificateId: row.certificate_id,
  };
}

async function loadAccessibleCourse(slug: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { supabase, user, course: null, unauthorized: true };

  const { data: course, error } = await supabase
    .from("community_courses")
    .select("id, slug, title, published, created_by")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Community certificate course lookup failed", error);
    return { supabase, user, course: null, failed: true };
  }

  if (!course || (!course.published && course.created_by !== user.id)) {
    return { supabase, user, course: null };
  }

  return { supabase, user, course };
}

export async function GET(_request: Request, { params }: Props) {
  const { slug } = await params;
  const { supabase, user, course, unauthorized, failed } = await loadAccessibleCourse(slug);
  if (unauthorized) return safeError("Sign in required.", 401);
  if (failed) return safeError("Could not load certificate.", 500);
  if (!course || !user) return safeError("Course not found.", 404);

  const { data, error } = await supabase
    .from("user_course_certificates")
    .select("learner_name, course_title, issued_at, score_percent, score_label, certificate_id")
    .eq("user_id", user.id)
    .eq("course_key", `community-${course.slug}`)
    .maybeSingle();

  if (error) {
    console.error("Community certificate lookup failed", error);
    return safeError("Could not load certificate.", 500);
  }

  return NextResponse.json({ certificate: data ? certificateResponse(data) : null });
}

export async function POST(request: Request, { params }: Props) {
  if (!checkSameOrigin(request)) {
    return safeError("Invalid request origin.", 403);
  }

  const { slug } = await params;
  const { supabase, user, course, unauthorized, failed } = await loadAccessibleCourse(slug);
  if (unauthorized) return safeError("Sign in required.", 401);
  if (failed) return safeError("Could not issue certificate.", 500);
  if (!course || !user) return safeError("Course not found.", 404);

  const limited = checkRateLimit({
    key: `certificate:community:${course.slug}:${user.id}:${getClientIp(request)}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return rateLimitResponse(limited.resetAt);
  }

  const parsed = issueCertificateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return safeError("Invalid certificate request.", 400);
  }

  const courseKey = `community-${course.slug}`;
  const { data: existing, error: existingError } = await supabase
    .from("user_course_certificates")
    .select("learner_name, course_title, issued_at, score_percent, score_label, certificate_id")
    .eq("user_id", user.id)
    .eq("course_key", courseKey)
    .maybeSingle();

  if (existingError) {
    console.error("Community certificate existing lookup failed", existingError);
    return safeError("Could not issue certificate.", 500);
  }
  if (existing) {
    return NextResponse.json({ certificate: certificateResponse(existing), alreadyIssued: true });
  }

  const { data: questionRows, error: questionError } = await supabase
    .from("community_chapter_questions")
    .select("id, prompt, options, correct_index, community_course_chapters!inner(course_id)")
    .eq("community_course_chapters.course_id", course.id);

  if (questionError) {
    console.error("Community certificate question lookup failed", questionError);
    return safeError("Could not grade assessment.", 500);
  }

  const questions = (questionRows ?? []).filter((question) => {
    return Array.isArray(question.options) && question.options.length > 1 && question.correct_index != null;
  });
  const total = questions.length;
  if (total === 0) {
    return safeError("This course does not have a final assessment yet.", 422);
  }

  const score = questions.reduce((sum, question) => {
    return sum + (parsed.data.answers[question.id] === question.correct_index ? 1 : 0);
  }, 0);
  const scorePercent = Math.round((score / total) * 100);

  if (scorePercent < PASS_MARK) {
    return NextResponse.json(
      {
        error: "Pass mark not met.",
        result: {
          scorePercent,
          scoreLabel: `${score}/${total}`,
          passMark: PASS_MARK,
        },
      },
      { status: 422, headers: { "Cache-Control": "no-store" } }
    );
  }

  const issuedAt = new Date();
  const certificateId = `MEDCOM-COMM-${issuedAt.getUTCFullYear()}${String(
    issuedAt.getUTCMonth() + 1
  ).padStart(2, "0")}${String(issuedAt.getUTCDate()).padStart(2, "0")}-${crypto
    .randomUUID()
    .slice(0, 8)
    .toUpperCase()}`;
  const learnerName =
    parsed.data.learnerName ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email ||
    "Learner";

  const { data, error } = await supabase
    .from("user_course_certificates")
    .insert({
      user_id: user.id,
      course_key: courseKey,
      course_title: course.title,
      learner_name: learnerName,
      score_percent: scorePercent,
      score_label: `${score}/${total}`,
      pass_mark: PASS_MARK,
      certificate_id: certificateId,
      answers_json: questions.map((question) => ({
        id: question.id,
        selectedIndex: parsed.data.answers[question.id] ?? null,
        correctIndex: question.correct_index,
        correct: parsed.data.answers[question.id] === question.correct_index,
      })),
      issued_at: issuedAt.toISOString(),
    })
    .select("learner_name, course_title, issued_at, score_percent, score_label, certificate_id")
    .single();

  if (error || !data) {
    console.error("Community certificate insert failed", error);
    return safeError("Could not issue certificate.", 500);
  }

  const { error: progressError } = await supabase.from("user_course_progress").upsert(
    {
      user_id: user.id,
      course_key: courseKey,
      course_title: course.title,
      status: "completed",
      progress: 100,
      resume_path: `/courses/community/${course.slug}/learn/assessment`,
      updated_at: issuedAt.toISOString(),
      completed_at: issuedAt.toISOString(),
    },
    { onConflict: "user_id,course_key" }
  );

  if (progressError) {
    console.error("Community certificate progress upsert failed", progressError);
  }

  return NextResponse.json({ certificate: certificateResponse(data) }, { status: 201 });
}
