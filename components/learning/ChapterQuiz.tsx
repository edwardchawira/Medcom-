"use client";

import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

export type ChapterQuizQuestion = {
  id: string;
  sort_order: number;
  prompt: string;
  options: string[];
  correct_index: number | null;
  explanation: string;
};

function optionLabel(index: number) {
  return String.fromCharCode(65 + index);
}

function makeHint(question: ChapterQuizQuestion) {
  if (question.explanation) {
    const firstSentence = question.explanation.split(/(?<=[.!?])\s+/)[0];
    if (firstSentence && firstSentence.length < 170) return firstSentence;
  }
  return "Look back at the key terms in this section and remove any answer that would increase risk or ignore the main safety step.";
}

export function ChapterQuiz({
  title = "Multiple Choice Questions",
  questions,
}: {
  title?: string;
  questions: ChapterQuizQuestion[];
}) {
  const sorted = useMemo(
    () => [...questions].sort((a, b) => a.sort_order - b.sort_order),
    [questions]
  );
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [hintOpen, setHintOpen] = useState<Record<string, boolean>>({});
  const question = sorted[questionIndex];

  if (!question) return null;

  const selected = answers[question.id] ?? null;
  const answered = selected != null;
  const correct = answered && question.correct_index != null && selected === question.correct_index;
  const wrong = answered && question.correct_index != null && selected !== question.correct_index;

  return (
    <section className="alison-slide-card mt-8" aria-labelledby="chapter-quiz-title">
      <h1 id="chapter-quiz-title" className="alison-title-bar">
        {title}
      </h1>
      <div className="alison-quiz">
        <div className="alison-quiz-head">
          <p>
            Question {questionIndex + 1} of {sorted.length}
          </p>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200" aria-hidden>
            <div
              className="h-full rounded-full bg-[#604696] transition-all"
              style={{ width: `${((questionIndex + 1) / sorted.length) * 100}%` }}
            />
          </div>
        </div>

        <h2>{question.prompt}</h2>

        <div className="alison-answer-list">
          {question.options.map((option, index) => {
            const isSelected = selected === index;
            const isCorrect = answered && question.correct_index === index;
            const isWrongPick = wrong && isSelected;
            return (
              <button
                key={`${question.id}-${index}`}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: index }))}
                className={[
                  isCorrect ? "is-correct" : "",
                  isWrongPick ? "is-wrong" : "",
                  isSelected && !isCorrect && !isWrongPick ? "is-selected" : "",
                ].join(" ")}
              >
                <span>{optionLabel(index)}</span>
                <strong>{option}</strong>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="alison-hint-button"
          onClick={() => setHintOpen((prev) => ({ ...prev, [question.id]: !prev[question.id] }))}
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          {hintOpen[question.id] ? "Hide hint" : "Show hint"}
        </button>

        {hintOpen[question.id] ? (
          <p className="alison-hint-panel">{makeHint(question)}</p>
        ) : null}

        {answered ? (
          <div className={correct ? "alison-feedback is-correct" : "alison-feedback is-wrong"} role="status">
            {correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <p>
              <strong>{correct ? "Correct." : "Not quite."}</strong>{" "}
              {question.explanation ||
                (correct
                  ? "That answer best matches the section."
                  : "Review the lesson detail and try again.")}
            </p>
          </div>
        ) : null}

        <div className="alison-quiz-actions">
          <button
            type="button"
            onClick={() => {
              setAnswers((prev) => ({ ...prev, [question.id]: null }));
              setHintOpen((prev) => ({ ...prev, [question.id]: false }));
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset
          </button>
          <div>
            <button
              type="button"
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((v) => Math.max(0, v - 1))}
            >
              Previous question
            </button>
            <button
              type="button"
              disabled={questionIndex === sorted.length - 1}
              onClick={() => setQuestionIndex((v) => Math.min(sorted.length - 1, v + 1))}
            >
              Next question
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
