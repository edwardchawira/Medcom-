"use client";

import { ZoomIn } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ markdown }: { markdown: string }) {
  const parts = splitVideoEmbeds(markdown);
  return (
    <div className="max-w-none text-slate-800 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:text-teal-700 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-teal-900 [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded">
      {parts.map((p, idx) =>
        p.kind === "markdown" ? (
          <Markdown
            key={idx}
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ src, alt }) => (
                <figure className="alison-image-frame">
                  <img src={src || ""} alt={alt || ""} />
                  <button type="button" aria-label={alt ? `View ${alt}` : "View image"}>
                    <ZoomIn className="h-4 w-4" aria-hidden />
                  </button>
                </figure>
              ),
            }}
          >
            {p.value}
          </Markdown>
        ) : (
          <figure
            key={idx}
            className="my-6 overflow-hidden rounded-xl border border-slate-200 bg-black/95"
          >
            <div className="aspect-square w-full bg-black">
              <video
                src={p.url}
                controls
                className="h-full w-full object-cover"
                preload="metadata"
              />
            </div>
            {p.caption ? (
              <figcaption className="bg-white px-4 py-2 text-sm text-slate-700 border-t border-slate-200">
                {p.caption}
              </figcaption>
            ) : null}
          </figure>
        )
      )}
    </div>
  );
}

type Part =
  | { kind: "markdown"; value: string }
  | { kind: "video"; url: string; caption: string | null };

/**
 * Supports non-technical embeds in plain text:
 * `::video[Optional caption](https://...mp4)`
 */
function splitVideoEmbeds(input: string): Part[] {
  const lines = input.split(/\r?\n/);
  const out: Part[] = [];
  let buf: string[] = [];

  const flush = () => {
    const v = buf.join("\n").trimEnd();
    if (v) out.push({ kind: "markdown", value: v + "\n" });
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(/^::video(?:\[(.*?)\])?\((.*?)\)\s*$/);
    if (m) {
      flush();
      out.push({
        kind: "video",
        caption: (m[1] ?? "").trim() || null,
        url: (m[2] ?? "").trim(),
      });
      continue;
    }
    buf.push(line);
  }
  flush();
  return out.length ? out : [{ kind: "markdown", value: input }];
}
