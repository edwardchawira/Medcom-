"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  stepKey: string;
  stepIndex: number;
  totalContentSteps: number;
  isAssessment: boolean;
  chapterTitle?: string;
  learningOutcomes: string[];
  estimatedMinutes?: number;
  contentBannerSrc?: string;
  children: ReactNode;
};

export function ActiveLearningChrome({
  stepKey,
  stepIndex,
  isAssessment,
  chapterTitle,
  learningOutcomes,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.18;
  const title = isAssessment ? chapterTitle || "Assessment" : chapterTitle || "Learning content";
  const showOutcomes = stepIndex === 0 && learningOutcomes.length > 0 && !isAssessment;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.article
        key={stepKey}
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
        transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
        className="alison-slide-card"
        aria-label={title}
      >
        {showOutcomes ? (
          <section className="alison-outcomes" aria-labelledby="learning-outcomes-title">
            <h1 id="learning-outcomes-title" className="alison-title-bar">
              Learning Outcomes
            </h1>
            <p className="alison-outcome-lead">
              Having completed this module, you will be able to:
            </p>
            <ul>
              {learningOutcomes.map((outcome) => (
                <li key={outcome}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="alison-content-section" aria-label={title}>
          <h1 className="alison-title-bar">{title}</h1>
          <div className="learning-content course-slide-content alison-content">{children}</div>
        </section>
      </motion.article>
    </AnimatePresence>
  );
}
