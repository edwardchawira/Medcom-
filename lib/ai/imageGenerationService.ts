import { generateText, Output } from "ai";
import { z } from "zod";
import { getOpenAIModel, shouldUseAiFallback } from "@/lib/ai/provider";
import { imageBlockSchema } from "@/lib/courseBuilder/types";

const imageSpecSchema = z.object({
  alt: z.string().min(1),
  caption: z.string().min(1),
});

export async function generateImageBlock(input: {
  chapterTitle: string;
  prompt: string;
}) {
  const fallbackUrl = "https://picsum.photos/seed/medcom-ai/1200/800";
  const model = getOpenAIModel("gpt-4o-mini");
  if (!model) {
    if (!shouldUseAiFallback()) {
      throw new Error("AI generation is not configured.");
    }
    return imageBlockSchema.parse({
      kind: "image",
      prompt: input.prompt,
      imageUrl: fallbackUrl,
      alt: `Illustration for ${input.chapterTitle}`,
      caption: "AI placeholder illustration",
    });
  }

  const textResult = await generateText({
    model,
    output: Output.object({ schema: imageSpecSchema }),
    prompt: `Create accessibility metadata for an instructional illustration.
Chapter: ${input.chapterTitle}
Image intent: ${input.prompt}
Return concise alt text and caption.`,
  });

  return imageBlockSchema.parse({
    kind: "image",
    prompt: input.prompt,
    imageUrl: fallbackUrl,
    alt: textResult.output.alt,
    caption: textResult.output.caption,
  });
}
