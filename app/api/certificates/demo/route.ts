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
import { demoTrainingCourse } from "@/lib/demoTrainingCourse";

const PASS_MARK = 80;

const issueCertificateSchema = z.object({
  learnerName: z.string().trim().min(1).max(120),
  answers: z.record(z.string(), z.number().int().min(0)),
});

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

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) {
    return safeError("Sign in required.", 401);
  }

  const { data, error } = await supabase
    .from("user_course_certificates")
    .select("learner_name, course_title, issued_at, score_percent, score_label, certificate_id")
    .eq("user_id", user.id)
    .eq("course_key", demoTrainingCourse.slug)
    .maybeSingle();

  if (error) {
    console.error("Demo certificate lookup failed", error);
    return safeError("Could not load certificate.", 500);
  }

  return NextResponse.json({ certificate: data ? certificateResponse(data) : null });
}

export async function POST(request: Request) {
  if (!checkSameOrigin(request)) {
    return safeError("Invalid request origin.", 403);
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return safeError("Sign in required.", 401);
  }

  const limited = checkRateLimit({
    key: `certificate:demo:${user.id}:${getClientIp(request)}`,
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

  const { data: existing, error: existingError } = await supabase
    .from("user_course_certificates")
    .select("learner_name, course_title, issued_at, score_percent, score_label, certificate_id")
    .eq("user_id", user.id)
    .eq("course_key", demoTrainingCourse.slug)
    .maybeSingle();

  if (existingError) {
    console.error("Demo certificate existing lookup failed", existingError);
    return safeError("Could not issue certificate.", 500);
  }
  if (existing) {
    return NextResponse.json({ certificate: certificateResponse(existing), alreadyIssued: true });
  }

  const total = demoTrainingCourse.assessment.length;
  const score = demoTrainingCourse.assessment.reduce((sum, question) => {
    return sum + (parsed.data.answers[question.id] === question.correctIndex ? 1 : 0);
  }, 0);
  const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;

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
  const certificateId = `MEDCOM-DEMO-${issuedAt.getUTCFullYear()}${String(
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
      course_key: demoTrainingCourse.slug,
      course_title: demoTrainingCourse.title,
      learner_name: learnerName,
      score_percent: scorePercent,
      score_label: `${score}/${total}`,
      pass_mark: PASS_MARK,
      certificate_id: certificateId,
      answers_json: demoTrainingCourse.assessment.map((question) => ({
        id: question.id,
        selectedIndex: parsed.data.answers[question.id] ?? null,
        correctIndex: question.correctIndex,
        correct: parsed.data.answers[question.id] === question.correctIndex,
      })),
      issued_at: issuedAt.toISOString(),
    })
    .select("learner_name, course_title, issued_at, score_percent, score_label, certificate_id")
    .single();

  if (error || !data) {
    console.error("Demo certificate insert failed", error);
    return safeError("Could not issue certificate.", 500);
  }

  const { error: progressError } = await supabase.from("user_course_progress").upsert(
    {
      user_id: user.id,
      course_key: demoTrainingCourse.slug,
      course_title: demoTrainingCourse.title,
      status: "completed",
      progress: 100,
      resume_path: `/courses/${demoTrainingCourse.slug}/learn/assessment`,
      updated_at: issuedAt.toISOString(),
      completed_at: issuedAt.toISOString(),
    },
    { onConflict: "user_id,course_key" }
  );

  if (progressError) {
    console.error("Demo certificate progress upsert failed", progressError);
  }

  return NextResponse.json({ certificate: certificateResponse(data) }, { status: 201 });
}

