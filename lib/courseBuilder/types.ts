import { z } from "zod";

export const textBlockSchema = z.object({
  kind: z.literal("text"),
  title: z.string().min(1),
  markdown: z.string().min(1),
});

export const imageBlockSchema = z.object({
  kind: z.literal("image"),
  prompt: z.string().min(1),
  imageUrl: z.string().url(),
  alt: z.string().min(1),
  caption: z.string().optional().default(""),
});

export const questionTypeSchema = z.enum(["multiple_choice", "short_answer", "true_false"]);

export const questionItemSchema = z.object({
  type: questionTypeSchema,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.string().min(1),
  explanation: z.string().optional().default(""),
});

export const questionBlockSchema = z.object({
  kind: z.literal("quiz"),
  title: z.string().min(1),
  questions: z.array(questionItemSchema).min(1),
});

export const contentBlockPayloadSchema = z.discriminatedUnion("kind", [
  textBlockSchema,
  imageBlockSchema,
  questionBlockSchema,
]);

export const contentBlockSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith("tmp_")),
  chapterId: z.string().uuid().or(z.string().startsWith("tmp_chapter_")),
  sortOrder: z.number().int().min(1),
  source: z.enum(["manual", "ai"]).default("manual"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  payload: contentBlockPayloadSchema,
});

export const lessonChapterSchema = z.object({
  id: z.string().uuid().or(z.string().startsWith("tmp_chapter_")),
  title: z.string().min(1),
  sortOrder: z.number().int().min(1),
  blocks: z.array(contentBlockSchema),
});

export const courseDraftSchema = z.object({
  title: z.string().min(1),
  prompt: z.string().min(1),
  audience: z.array(z.string()).default([]),
  duration: z.string().default("Self-paced"),
  chapters: z.array(lessonChapterSchema).min(1),
});

export const generateOutlineRequestSchema = z.object({
  prompt: z.string().min(10).max(6000),
  title: z.string().min(1).max(300),
  audience: z.array(z.string().min(1).max(80)).max(12).default([]),
  level: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  duration: z.string().max(120).default("Self-paced"),
  sourceText: z.string().max(60000).optional().default(""),
  sourceNames: z.array(z.string().min(1).max(240)).max(12).optional().default([]),
});

export const generateBlockRequestSchema = z.object({
  chapterTitle: z.string().min(1).max(240),
  courseTitle: z.string().min(1).max(300),
  contextMarkdown: z.string().max(30000).default(""),
  blockType: z.enum(["text", "image", "quiz"]),
  prompt: z.string().min(8).max(4000),
});

export const regenerateBlockRequestSchema = z.object({
  blockId: z.string().min(1),
  blockType: z.enum(["text", "image", "quiz"]),
  prompt: z.string().min(8).max(4000),
  courseTitle: z.string().min(1).max(300),
  chapterTitle: z.string().min(1).max(240),
  contextMarkdown: z.string().max(30000).default(""),
});

export type ContentBlock = z.infer<typeof contentBlockSchema>;
export type ContentBlockPayload = z.infer<typeof contentBlockPayloadSchema>;
export type CourseDraft = z.infer<typeof courseDraftSchema>;
export type GenerateOutlineRequest = z.infer<typeof generateOutlineRequestSchema>;
export type GenerateBlockRequest = z.infer<typeof generateBlockRequestSchema>;
