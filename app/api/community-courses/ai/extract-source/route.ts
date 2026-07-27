import { NextResponse } from "next/server";
import {
  checkRateLimit,
  checkSameOrigin,
  getClientIp,
  rateLimitResponse,
  requireUser,
  safeError,
} from "@/lib/api/security";
import { extractCourseSourceFromFiles } from "@/lib/courseBuilder/documentExtraction";

export const runtime = "nodejs";

const MAX_MULTIPART_BYTES = 70 * 1024 * 1024;

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const { user } = await requireUser();

  if (!user) {
    return safeError("Sign in required", 401);
  }

  const limited = checkRateLimit({
    key: `ai:extract:${user.id}:${getClientIp(req)}`,
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return rateLimitResponse(limited.resetAt);
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_MULTIPART_BYTES) {
    return NextResponse.json(
      { error: "Uploaded source files are too large. Use 60 MB or less in total." },
      { status: 413 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    console.error("Course source upload parse failed", err);
    return safeError(
      "The upload could not be parsed. Try fewer files, or keep the total upload under 60 MB.",
      400
    );
  }

  const files = form
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  try {
    const source = await extractCourseSourceFromFiles(files);
    return NextResponse.json(
      { source },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not extract source material.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
