"use client";

import { useMemo, useState } from "react";
import AskQuestionForm from "@/components/ask-question-form";
import AnswerQuestionForm from "@/components/answer-question-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import SplitText from "@/components/ui/splitText";
import { templates } from "@/lib/ai/templates";
import { cn } from "@/lib/utils";

//component specific types
type Attachment = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  byte_size: number | null;
  position: number;
  uploaded_by: string;
  created_at: string;
  publicUrl?: string;
};

type AnswerWithMeta = {
  id: number;
  question_id: number;
  author_id: string;
  authorName: string;
  answer: string;
  created_at: string;
  attachments: Attachment[];
};

type QuestionWithMeta = {
  id: number;
  session_id: number;
  author_id: string;
  authorName: string;
  title: string;
  description: string | null;
  created_at: string;
  attachments: Attachment[];
  answers: AnswerWithMeta[];
};

type Permissions = {
  canAsk: boolean;
  canAnswer: boolean;
  isSessionMember: boolean;
  banMessage: string | null;
  banUntil: string | null;
  requiresLogin: boolean;
};

type QnAClientProps = {
  sessionId: number;
  groupId: number;
  sessionName: string;
  questions: QuestionWithMeta[];
  permissions: Permissions;
  membershipNotice: string | null;
  aiHistory: {
    submission_id: string;
    response: string;
    user_answer: string | null;
    ai_feedback: string | null;
    created_at?: string;
    prompt?: string | null;
  }[];
};

type ChallengeView = {
  question: string;
  idealAnswer: string;
  whyItMatters: string;
  difficulty: string;
  coachTip: string;
};

type FeedbackView = {
  verdict: string;
  strength: string;
  gap: string;
  improve: string;
};

const difficultyBadge: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-rose-50 text-rose-700 border-rose-200",
};

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.mime_type?.startsWith("image/") && attachment.publicUrl) {
    return (
      <div className="inline-flex items-center justify-center">
        <Image
          src={attachment.publicUrl!}
          alt={attachment.mime_type ?? "attachment"}
          width={1200}
          height={800}
          className="block h-auto w-auto max-h-[180px] max-w-[300px] object-contain border rounded-lg"
          quality={90}
          unoptimized
        />
      </div>
    );
  }

  return (
    <Button asChild variant="outline" className="justify-start h-9">
      <a href={attachment.publicUrl ?? "#"} target="_blank" rel="noopener noreferrer">
        {attachment.mime_type ?? "Download attachment"}
      </a>
    </Button>
  );
}

function parseChallenge(response: string): ChallengeView {
  try {
    const parsed = JSON.parse(response);
    return {
      question: parsed.question ?? response,
      idealAnswer: parsed.idealAnswer ?? "",
      whyItMatters: parsed.whyItMatters ?? "",
      difficulty: parsed.difficulty ?? "medium",
      coachTip: parsed.coachTip ?? "",
    };
  } catch {
    return {
      question: response,
      idealAnswer: "",
      whyItMatters: "",
      difficulty: "medium",
      coachTip: "",
    };
  }
}

function parseFeedback(feedback: string | null): FeedbackView | null {
  if (!feedback) return null;
  try {
    const parsed = JSON.parse(feedback);
    return {
      verdict: parsed.verdict ?? "almost",
      strength: parsed.strength ?? "",
      gap: parsed.gap ?? "",
      improve: parsed.improve ?? "",
    };
  } catch {
    return null;
  }
}

function AiHistoryList({ history }: { history: QnAClientProps["aiHistory"] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Your AI challenge history will show up here after you request one.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const parsedChallenge = parseChallenge(entry.response);
        const parsedFeedback = parseFeedback(entry.ai_feedback);
        return (
          <div
            key={entry.submission_id}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
            data-cy="ai-history-row"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{parsedChallenge.question}</p>
              <Badge
                variant="outline"
                className={cn(
                  "uppercase tracking-wide text-[10px]",
                  difficultyBadge[parsedChallenge.difficulty] ?? "",
                )}
              >
                {parsedChallenge.difficulty}
              </Badge>
            </div>
            {parsedFeedback ? (
              <div className="mt-2 text-xs text-slate-600">
                Verdict: {parsedFeedback.verdict} · Tip: {parsedFeedback.improve}
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500">Waiting for your answer.</div>
            )}
            <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
              <span>{new Date(entry.created_at ?? Date.now()).toLocaleString()}</span>
              <span className="opacity-70">Saved</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AiModal({
  open,
  challenge,
  answer,
  onChangeAnswer,
  onSubmit,
  onClose,
  feedback,
  loading,
  error,
}: {
  open: boolean;
  challenge: ChallengeView | null;
  answer: string;
  onChangeAnswer: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  feedback: FeedbackView | null;
  loading: boolean;
  error: string | null;
}) {
  if (!open || !challenge) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center px-4">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 relative overflow-hidden"
        data-cy="ai-challenge-modal"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-400" />
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">AI Challenge</p>
              <h3 className="text-xl font-semibold text-slate-900" data-cy="ai-question">
                {challenge.question}
              </h3>
              <p className="text-sm text-slate-600 mt-2">{challenge.whyItMatters}</p>
              {challenge.coachTip ? (
                <p className="text-xs text-slate-500 mt-1">Coach tip: {challenge.coachTip}</p>
              ) : null}
            </div>
            <Badge
              variant="outline"
              className={cn(
                "uppercase text-[10px] tracking-wide",
                difficultyBadge[challenge.difficulty] ?? "",
              )}
            >
              {challenge.difficulty}
            </Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="ai-answer">
              Your answer
            </label>
            <textarea
              id="ai-answer"
              data-cy="ai-answer-input"
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="Type your response here..."
              value={answer}
              onChange={(e) => onChangeAnswer(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onSubmit}
              disabled={loading}
              data-cy="ai-submit-answer"
            >
              {loading ? "Scoring..." : "Submit for feedback"}
            </Button>
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Close
            </Button>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>

          {feedback ? (
            <div
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-2"
              data-cy="ai-feedback"
            >
              <p className="text-sm font-semibold text-emerald-800">Verdict: {feedback.verdict}</p>
              <p className="text-sm text-emerald-900">Strength: {feedback.strength}</p>
              <p className="text-sm text-emerald-900">Gap: {feedback.gap}</p>
              <p className="text-sm text-emerald-900">Improve: {feedback.improve}</p>
            </div>
          ) : null}

          <div className="text-[11px] text-slate-500">
            Template used: <code className="font-mono">{templates.feedbackTemplate.slice(0, 60)}...</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QnAClient({
  sessionId,
  groupId,
  sessionName,
  questions,
  permissions,
  membershipNotice,
  aiHistory,
}: QnAClientProps) {
  const unanswered = useMemo(() => questions.filter((q) => q.answers.length === 0), [questions]);
  const answered = useMemo(() => questions.filter((q) => q.answers.length > 0), [questions]);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiChallenge, setAiChallenge] = useState<ChallengeView | null>(null);
  const [aiSubmissionId, setAiSubmissionId] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiFeedback, setAiFeedback] = useState<FeedbackView | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistoryState, setAiHistoryState] = useState(aiHistory ?? []);

  const offlineChallenge: ChallengeView = {
    question: `What is one key takeaway from ${sessionName}?`,
    idealAnswer: "State the core idea in one sentence.",
    whyItMatters: "Checks that you captured the headline concept.",
    difficulty: "medium",
    coachTip: "Lead with the main idea, then add one supporting detail.",
  };

  const canRequestAi = !permissions.banMessage;

  const requestChallenge = async () => {
    setAiError(null);
    setAiFeedback(null);
    setAiLoading(true);

    try {
      const resp = await fetch("/ai/generateChallenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!resp.ok) {
        throw new Error("Could not fetch AI challenge");
      }

      const jr = await resp.json();
      setAiSubmissionId(jr.submissionId);
      setAiChallenge(jr.challenge ?? offlineChallenge);
      setAiModalOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI is unavailable, showing an offline prompt.";
      setAiError(message);
      setAiSubmissionId(`offline-${Date.now()}`);
      setAiChallenge(offlineChallenge);
      setAiModalOpen(true);
    } finally {
      setAiLoading(false);
    }
  };

  const submitForFeedback = async () => {
    if (!aiChallenge) return;
    if (!aiAnswer.trim()) {
      setAiError("Add an answer before submitting.");
      return;
    }
    setAiError(null);
    setAiLoading(true);

    try {
      const resp = await fetch("/ai/submitForFeedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: aiSubmissionId,
          user_answer: aiAnswer,
        }),
      });

      if (!resp.ok) {
        throw new Error("AI feedback failed");
      }

      const jr = await resp.json();
      const feedback: FeedbackView = jr.feedback ?? null;
      setAiFeedback(feedback);

      setAiHistoryState((prev) => [
        {
          submission_id: aiSubmissionId ?? `local-${Date.now()}`,
          response: JSON.stringify(aiChallenge),
          user_answer: aiAnswer,
          ai_feedback: feedback ? JSON.stringify(feedback) : null,
          created_at: new Date().toISOString(),
          prompt: templates.challengeTemplate,
        },
        ...prev,
      ]);
    } catch (err) {
      const fallback: FeedbackView = {
        verdict: "almost",
        strength: "You identified the main idea.",
        gap: "Tighten your reasoning with one detail.",
        improve: "Add why this matters to the session.",
      };
      setAiFeedback(fallback);
      setAiError(
        err instanceof Error
          ? `${err.message}. Using offline feedback.`
          : "Using offline feedback.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl bg-gradient-to-br from-purple-50 via-white to-emerald-50 border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1>
              <SplitText
                text={sessionName}
                className="text-2xl font-bold text-purple-600"
                delay={100}
                duration={0.6}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
              />
            </h1>
            {membershipNotice ? (
              <p className="text-sm text-slate-600 mt-1">{membershipNotice}</p>
            ) : (
              <p className="text-sm text-slate-600 mt-1">
                Ask questions, get answers, and request an AI challenge on demand.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <AskQuestionForm
              sessionId={sessionId}
              groupId={groupId}
              canAsk={permissions.canAsk}
              banMessage={permissions.banMessage ?? membershipNotice}
            />
            <Button
              variant="outline"
              className="rounded-xl bg-purple-600 text-white border-purple-500 hover:bg-purple-700"
              onClick={requestChallenge}
              disabled={!canRequestAi || aiLoading}
              data-cy="ai-challenge-button"
            >
              {aiLoading ? "Thinking..." : "AI Challenge"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-5 space-y-6">
            {questions.length === 0 ? (
              <p className="text-slate-500">
                No questions yet. Start the conversation or try the AI challenge button.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-medium text-slate-600">
                      Unanswered ({unanswered.length})
                    </h2>
                  </div>
                  <ul className="space-y-4">
                    {unanswered.map((q) => (
                      <li key={q.id} className="border border-slate-200 rounded-2xl p-4 bg-white">
                        <p className="text-xs text-slate-500">{q.authorName} asked</p>
                        <h3 className="font-semibold text-purple-600">{q.title}</h3>
                        {q.description ? (
                          <p className="text-sm text-slate-600">{q.description}</p>
                        ) : null}

                        {q.attachments.length > 0 ? (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {q.attachments.map((a) => (
                              <AttachmentPreview key={a.id} attachment={a} />
                            ))}
                          </div>
                        ) : null}

                        <div className="flex items-center gap-3 text-sm mt-3">
                          <AnswerQuestionForm
                            questionId={q.id}
                            sessionId={sessionId}
                            groupId={groupId}
                            canAnswer={permissions.canAnswer}
                            banMessage={permissions.banMessage ?? membershipNotice}
                          />
                        </div>

                        <div className="text-xs text-slate-400 mt-2">
                          Created{" "}
                          {new Date(q.created_at).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h2 className="text-sm font-medium text-slate-600 mb-2">
                    Answered ({answered.length})
                  </h2>
                  <ul className="space-y-4">
                    {answered.map((q) => (
                      <li
                        key={q.id}
                        className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white"
                      >
                        <div>
                          <p className="text-xs text-slate-500">{q.authorName} asked</p>
                          <h3 className="font-semibold text-purple-600">{q.title}</h3>
                          {q.description ? (
                            <p className="text-sm text-slate-600">{q.description}</p>
                          ) : null}
                          {q.attachments.length > 0 ? (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {q.attachments.map((a) => (
                                <AttachmentPreview key={a.id} attachment={a} />
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {q.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2"
                          >
                            <div className="text-xs text-slate-500">
                              {answer.authorName} answered ·{" "}
                              {new Date(answer.created_at).toLocaleString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                            <p className="text-slate-700">{answer.answer}</p>
                            {answer.attachments.length > 0 ? (
                              <div className="grid grid-cols-3 gap-2">
                                {answer.attachments.map((a) => (
                                  <AttachmentPreview key={a.id} attachment={a} />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}

                        <div className="flex items-center gap-3 text-sm">
                          <AnswerQuestionForm
                            questionId={q.id}
                            sessionId={sessionId}
                            groupId={groupId}
                            canAnswer={permissions.canAnswer}
                            banMessage={permissions.banMessage ?? membershipNotice}
                          />
                        </div>

                        <div className="text-xs text-slate-400">
                          Created{" "}
                          {new Date(q.created_at).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">AI Study Coach</p>
                <h3 className="text-lg font-semibold text-slate-800">Saved prompts</h3>
              </div>
              <Badge variant="outline" className="rounded-full">
                Template ready
              </Badge>
            </div>
            <AiHistoryList history={aiHistoryState} />
          </CardContent>
        </Card>
      </div>

      <AiModal
        open={aiModalOpen}
        challenge={aiChallenge}
        answer={aiAnswer}
        onChangeAnswer={setAiAnswer}
        onSubmit={submitForFeedback}
        onClose={() => setAiModalOpen(false)}
        feedback={aiFeedback}
        loading={aiLoading}
        error={aiError}
      />
    </div>
  );
}
