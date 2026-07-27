import { NextResponse } from "next/server";
import {
  checkRateLimit,
  checkSameOrigin,
  getClientIp,
  rateLimitResponse,
  requireUser,
  safeError,
} from "@/lib/api/security";
import { orchestrateBlockGeneration } from "@/lib/ai/generationOrchestrator";
import { generateBlockRequestSchema } from "@/lib/courseBuilder/types";

export async function POST(req: Request) {
  if (!checkSameOrigin(req)) {
    return safeError("Invalid request origin.", 403);
  }

  const { user } = await requireUser();

  if (!user) {
    return safeError("Sign in required", 401);
  }

  const limited = checkRateLimit({
    key: `ai:block:${user.id}:${getClientIp(req)}`,
    limit: 40,
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

  const parsed = generateBlockRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const block = await orchestrateBlockGeneration(parsed.data);
    return NextResponse.json(
      { block },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Block generation failed", err);
    return safeError("Block generation failed. Please try again.", 502);
  }
}
