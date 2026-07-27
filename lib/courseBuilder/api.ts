import type { ContentBlockPayload } from "@/lib/courseBuilder/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const raw = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  let data: (T & { error?: string }) | null = null;

  if (raw.trim()) {
    try {
      data = JSON.parse(raw) as T & { error?: string };
    } catch {
      // Leave data null; we'll throw a more useful error below.
    }
  }

  if (!response.ok) {
    const message =
      data?.error ??
      (raw.trim()
        ? `Request failed (${response.status}). Non-JSON response: ${raw.slice(0, 240)}`
        : `Request failed (${response.status}). Empty response body.`);
    throw new Error(message);
  }

  if (!data) {
    throw new Error(
      raw.trim()
        ? `Expected JSON but got: ${contentType || "unknown content-type"}`
        : "Expected JSON but got an empty response body."
    );
  }

  return data;
}

export async function apiGenerateOutline(payload: {
  title: string;
  prompt: string;
  audience: string[];
  level: "beginner" | "intermediate" | "advanced";
  duration: string;
  sourceText?: string;
  sourceNames?: string[];
}) {
  return request<{
    outline: {
      chapters: {
        title: string;
        summary: string;
        lessonMarkdown: string;
        questions?: {
          type: "multiple_choice" | "short_answer" | "true_false";
          question: string;
          options?: string[];
          answer: string;
          explanation?: string;
        }[];
      }[];
    };
  }>(
    "/api/community-courses/ai/generate-outline",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function apiExtractSource(files: File[]) {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));

  const response = await fetch("/api/community-courses/ai/extract-source", {
    method: "POST",
    body,
  });
  const data = (await response.json()) as {
    source?: {
      titleHint: string;
      combinedText: string;
      truncated: boolean;
      files: {
        name: string;
        type: string;
        size: number;
        format: string;
        chars: number;
        warning?: string;
      }[];
    };
    error?: string;
  };

  if (!response.ok || !data.source) {
    throw new Error(data.error ?? "Could not extract source material.");
  }

  return data.source;
}

export async function apiGenerateBlock(payload: {
  chapterTitle: string;
  courseTitle: string;
  contextMarkdown: string;
  blockType: "text" | "image" | "quiz";
  prompt: string;
}) {
  return request<{ block: ContentBlockPayload }>("/api/community-courses/ai/generate-block", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function apiRegenerateBlock(payload: {
  blockId: string;
  chapterTitle: string;
  courseTitle: string;
  contextMarkdown: string;
  blockType: "text" | "image" | "quiz";
  prompt: string;
}) {
  return request<{ block: ContentBlockPayload; version: number }>(
    "/api/community-courses/ai/regenerate-block",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function apiPatchBlock(blockId: string, payload: ContentBlockPayload) {
  return request<{ ok: true }>(`/api/community-courses/blocks/${blockId}`, {
    method: "PATCH",
    body: JSON.stringify({ payload }),
  });
}

export async function apiDeleteBlock(blockId: string) {
  return request<{ ok: true }>(`/api/community-courses/blocks/${blockId}`, { method: "DELETE" });
}

export async function apiReorderBlocks(items: { id: string; sortOrder: number }[]) {
  return request<{ ok: true }>("/api/community-courses/blocks/reorder", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
