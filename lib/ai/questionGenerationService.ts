import { generateText, Output } from "ai";
import { z } from "zod";
import { getOpenAIModel, shouldUseAiFallback } from "@/lib/ai/provider";
import { questionBlockSchema } from "@/lib/courseBuilder/types";

const generatedQuestionBlockSchema = z.object({
  kind: z.literal("quiz"),
  title: z.string().min(1),
  questions: z.array(
    z.object({
      type: z.enum(["multiple_choice", "short_answer", "true_false"]),
      question: z.string().min(1),
      options: z.array(z.string()),
      answer: z.string().min(1),
      explanation: z.string(),
    })
  ).min(1),
});

export async function generateQuestionBlock(input: {
  courseTitle: string;
  chapterTitle: string;
  prompt: string;
  contextMarkdown: string;
}) {
  const model = getOpenAIModel("gpt-4o-mini");
  const fallback = () =>
    questionBlockSchema.parse({
      kind: "quiz",
      title: `${input.chapterTitle} knowledge check`,
      questions: [
        {
          type: "multiple_choice",
          question: "What is the core takeaway from this section?",
          options: ["Ignore safety checks", "Apply the documented process", "Skip verification"],
          answer: "Apply the documented process",
          explanation: "The lesson emphasizes safe, repeatable workflow steps.",
        },
        {
          type: "true_false",
          question: "Following a documented process reduces avoidable errors.",
          options: ["True", "False"],
          answer: "True",
          explanation: "Structured workflows reduce variance and risk.",
        },
        {
          type: "short_answer",
          question: "Name one moment when you should pause to verify your work.",
          options: [],
          answer: "Before proceeding to the next step (verification checkpoint).",
          explanation: "Verification checkpoints prevent compounding mistakes.",
        },
      ],
    });
  if (!model) {
    if (!shouldUseAiFallback()) {
      throw new Error("AI generation is not configured.");
    }
    return fallback();
  }

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: generatedQuestionBlockSchema }),
      prompt: `Generate a quiz block aligned to this lesson.
Course: ${input.courseTitle}
Chapter: ${input.chapterTitle}
Prompt: ${input.prompt}
Lesson context:
${input.contextMarkdown}

Include MCQ, short-answer, and true/false questions where appropriate.`,
    });

    return questionBlockSchema.parse(result.output);
  } catch (error) {
    if (!shouldUseAiFallback()) {
      throw error;
    }
    return fallback();
  }
}
