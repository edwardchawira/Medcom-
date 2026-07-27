"use client";

import { ZoomIn } from "lucide-react";
import { useState } from "react";

export type InteractiveTopic = {
  title: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  bullets?: string[];
};

export function InteractiveTopicCard({
  title,
  intro,
  topics,
}: {
  title?: string;
  intro?: string;
  topics: InteractiveTopic[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = topics[activeIndex];

  if (!active) return null;

  return (
    <section className="alison-interactive" aria-label={title || "Interactive topics"}>
      {title ? <h2>{title}</h2> : null}
      {intro ? <p>{intro}</p> : null}
      <div className="alison-topic-card">
        <div className="alison-topic-tabs" role="tablist" aria-orientation="vertical">
          {topics.map((topic, index) => (
            <button
              key={topic.title}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls="alison-topic-panel"
              onClick={() => setActiveIndex(index)}
              className={index === activeIndex ? "is-active" : ""}
            >
              {topic.title}
            </button>
          ))}
        </div>
        <article id="alison-topic-panel" className="alison-topic-detail" role="tabpanel">
          {active.imageUrl ? (
            <figure>
              <img src={active.imageUrl} alt={active.imageAlt || active.title} />
              <button type="button" aria-label={`View ${active.title} image`}>
                <ZoomIn className="h-4 w-4" aria-hidden />
              </button>
            </figure>
          ) : null}
          <div>
            <h3>{active.title}</h3>
            <p>{active.body}</p>
            {active.bullets?.length ? (
              <ul>
                {active.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
