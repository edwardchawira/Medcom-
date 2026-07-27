import { generateText, Output } from "ai";
import { z } from "zod";
import { getOpenAIModel, shouldUseAiFallback } from "@/lib/ai/provider";
import { textBlockSchema } from "@/lib/courseBuilder/types";

const generatedQuestionSchema = z.object({
  type: z.enum(["multiple_choice", "short_answer", "true_false"]),
  question: z.string().min(1),
  options: z.array(z.string()),
  answer: z.string().min(1),
  explanation: z.string(),
});

const generatedOutlineSchema = z.object({
  chapters: z.array(
    z.object({
      title: z.string().min(1),
      summary: z.string().min(1),
      lessonMarkdown: z.string().min(1),
      questions: z.array(generatedQuestionSchema),
    })
  ),
});

export async function generateCourseOutline(input: {
  title: string;
  prompt: string;
  audience: string[];
  level: string;
  duration: string;
  sourceText?: string;
  sourceNames?: string[];
}) {
  const sourceText = (input.sourceText ?? "").trim();
  const sourceNames = input.sourceNames?.filter(Boolean) ?? [];
  const model = getOpenAIModel("gpt-4o-mini");
  if (!model) {
    if (!shouldUseAiFallback()) {
      throw new Error("AI generation is not configured.");
    }
    return fallbackOutline(input, sourceText);
  }

  const result = await generateText({
    model,
    output: Output.object({ schema: generatedOutlineSchema }),
    prompt: `Create a complete professional educational course for Medcom from the source material.
Title: ${input.title}
Audience: ${input.audience.join(", ") || "General"}
Level: ${input.level}
Duration: ${input.duration}
User prompt: ${input.prompt}
${sourceNames.length ? `Source files: ${sourceNames.join(", ")}` : ""}
${sourceText ? `\nExtracted source material:\n${sourceText}` : ""}

Instructions:
- Treat syllabus/objective material as the course map and detailed source material as the body content.
- Identify and preserve important facts, procedures, obligations, definitions, risks, contraindications, examples, and practical actions.
- Merge duplicate points and impose a clear training structure rather than following the source order blindly.
- Write in polished UK health and social care training style.
- Keep the content faithful to the source. If the source does not support a detail, do not invent it.
- Return 8-12 chapters unless the source is very short.
- Each chapter's lessonMarkdown must be substantial, not a short summary. Aim for 450-900 words per chapter where source material supports it.
- Each lessonMarkdown should include: learning outcomes, key teaching content, practical guidance, common mistakes or risks, a short scenario/checkpoint, and a concise recap.
- For each chapter, include 2-3 practical knowledge-check questions aligned to the chapter. Use multiple choice or true/false where possible, and make sure the answer exactly matches one of the options. For short-answer questions, return options as an empty array.
- Include medication-specific details from the source such as legislation, types/forms of medicines, rights of administration, packaging, storage, handling methods, routes, errors, adverse reactions, documentation, MAR/eMAR, transcription, covert administration, time-critical medicines, PRN medicines, precautions, and references when present.
- Do not return generic filler such as "Generated with AI-assisted builder".`,
  });

  return result.output;
}

function fallbackOutline(
  input: {
    title: string;
    prompt: string;
    audience: string[];
    level: string;
    duration: string;
  },
  sourceText: string
) {
  const chunks = sourceText ? splitIntoFallbackChapters(sourceText) : [];
  if (chunks.length === 0) {
    return {
      chapters: [
        {
          title: "Generated Introduction",
          summary: `Overview for ${input.title}`,
          lessonMarkdown: `## ${input.title}\n\n${input.prompt}\n\n- Audience: ${input.audience.join(", ") || "General"}\n- Level: ${input.level}\n- Duration: ${input.duration}`,
        },
      ],
    };
  }

  return {
    chapters: chunks.map((chunk, index) => ({
      title: chunk.title || `Chapter ${index + 1}`,
      summary: chunk.summary,
      lessonMarkdown: `## ${chunk.title || `Chapter ${index + 1}`}\n\n${chunk.body}`,
      questions: [
        {
          type: "short_answer" as const,
          question: `Name one key safe-practice point from ${chunk.title || `chapter ${index + 1}`}.`,
          options: [],
          answer: "Follow the documented medication process and check local policy.",
          explanation: "The learner should identify a source-based safety or documentation point.",
        },
      ],
    })),
  };
}

function splitIntoFallbackChapters(sourceText: string) {
  const paragraphs = sourceText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chunkCount = Math.min(6, Math.max(3, Math.ceil(paragraphs.length / 5)));
  const chunkSize = Math.ceil(paragraphs.length / chunkCount);
  return Array.from({ length: chunkCount })
    .map((_, index) => {
      const slice = paragraphs.slice(index * chunkSize, (index + 1) * chunkSize);
      if (slice.length === 0) return null;
      const first = slice[0].replace(/^#+\s*/, "");
      const title = first.length <= 90 ? first : `Key topic ${index + 1}`;
      const body = slice.join("\n\n").slice(0, 5000);
      return {
        title,
        summary: body.slice(0, 220),
        body,
      };
    })
    .filter((chunk): chunk is { title: string; summary: string; body: string } => Boolean(chunk));
}

export async function generateTextBlock(input: {
  courseTitle: string;
  chapterTitle: string;
  prompt: string;
  contextMarkdown: string;
}) {
  const model = getOpenAIModel("gpt-4o-mini");
  if (!model) {
    if (!shouldUseAiFallback()) {
      throw new Error("AI generation is not configured.");
    }
    return textBlockSchema.parse({
      kind: "text",
      title: `${input.chapterTitle} lesson`,
      markdown: `### ${input.chapterTitle}\n\n${input.prompt}\n\n- Context enriched from current draft\n- Add references and examples`,
    });
  }

  const result = await generateText({
    model,
    output: Output.object({ schema: textBlockSchema }),
    prompt: `Generate one structured learning text block for a course.
Course: ${input.courseTitle}
Chapter: ${input.chapterTitle}
Prompt: ${input.prompt}
Current context markdown: ${input.contextMarkdown}

Return markdown with headings, concise paragraphs, and bullet points.`,
  });

  return result.output;
}
