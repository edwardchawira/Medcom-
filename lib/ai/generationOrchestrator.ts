import type { ContentBlockPayload } from "@/lib/courseBuilder/types";
import { generateImageBlock } from "@/lib/ai/imageGenerationService";
import { generateQuestionBlock } from "@/lib/ai/questionGenerationService";
import { generateCourseOutline, generateTextBlock } from "@/lib/ai/textGenerationService";

export async function orchestrateOutlineGeneration(input: {
  title: string;
  prompt: string;
  audience: string[];
  level: string;
  duration: string;
  sourceText?: string;
  sourceNames?: string[];
}) {
  return generateCourseOutline(input);
}

export async function orchestrateBlockGeneration(input: {
  blockType: "text" | "image" | "quiz";
  chapterTitle: string;
  courseTitle: string;
  prompt: string;
  contextMarkdown: string;
}): Promise<ContentBlockPayload> {
  if (input.blockType === "text") {
    return generateTextBlock(input);
  }
  if (input.blockType === "image") {
    return generateImageBlock(input);
  }
  return generateQuestionBlock(input);
}
