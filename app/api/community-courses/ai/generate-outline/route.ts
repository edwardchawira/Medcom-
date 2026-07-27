import { NextResponse } from "next/server";
import {
  checkRateLimit,
  checkSameOrigin,
  getClientIp,
  rateLimitResponse,
  requireUser,
  safeError,
} from "@/lib/api/security";
import { orchestrateOutlineGeneration } from "@/lib/ai/generationOrchestrator";
import { generateOutlineRequestSchema } from "@/lib/courseBuilder/types";

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const { user } = await requireUser();

  if (!user) {
    return safeError("Sign in required", 401);
  }

  const limited = checkRateLimit({
    key: `ai:outline:${user.id}:${getClientIp(req)}`,
    limit: 12,
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

  const parsed = generateOutlineRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const outline = await orchestrateOutlineGeneration(parsed.data);
    return NextResponse.json({ outline }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Course outline generation failed", error);
    return safeError("Course outline generation failed. Please try again.", 502);
  }
}
