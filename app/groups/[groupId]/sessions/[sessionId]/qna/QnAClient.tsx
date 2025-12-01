// app/groups/[groupId]/sessions/[sessionId]/qna/QnAClient.tsx

"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";

import AskQuestionForm from "@/components/ask-question-form";
import AnswerQuestionForm from "@/components/answer-question-form";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/ui/splitText";

interface Attachment {
  id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  byte_size: number | null;
  position: number;
  uploaded_by: string;
  created_at: string;
  publicUrl?: string;
}

interface AnswerWithMeta {
  id: number;
  question_id: number;
  author_id: string;
  is_anonymous?: boolean;
  authorName: string;
  answer: string;
  created_at: string;
  attachments: Attachment[];
}

interface QuestionWithMeta {
  id: number;
  session_id: number;
  author_id: string;
  is_anonymous?: boolean;
  authorName: string;
  title: string;
  description: string | null;
  created_at: string;
  attachments: Attachment[];
  answers: AnswerWithMeta[];
}

interface Permissions {
  canAsk: boolean;
  canAnswer: boolean;
  isSessionMember: boolean;
  banMessage: string | null;
  banUntil: string | null;
  requiresLogin: boolean;
}

interface QnAClientProps {
  sessionId: number;
  groupId: number;
  sessionName: string;
  questions: QuestionWithMeta[];
  permissions: Permissions;
  membershipNotice: string | null;
}

const AttachmentPreview: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  if (attachment.mime_type?.startsWith("image/") && attachment.publicUrl) {
    return (
      <div className="inline-flex items-center justify-center">
        <Image
          src={attachment.publicUrl}
          alt={attachment.mime_type ?? "attachment"}
          width={1200}
          height={800}
          className="block h-auto w-auto max-h-[180px] max-w-[300px] rounded-lg border border-border object-contain"
          quality={90}
          unoptimized
        />
      </div>
    );
  }

  return (
    <Button asChild variant="outline" className="h-9 justify-start">
      <a href={attachment.publicUrl ?? "#"} target="_blank" rel="noopener noreferrer">
        {attachment.mime_type ?? "Download attachment"}
      </a>
    </Button>
  );
};

export const QnAClient: React.FC<QnAClientProps> = ({
  sessionId,
  groupId,
  sessionName,
  questions,
  permissions,
  membershipNotice,
}) => {
  const [aiQuestionId, setAiQuestionId] = useState<number | null>(null);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<number | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const unanswered = useMemo(() => questions.filter((q) => q.answers.length === 0), [questions]);
  const answered = useMemo(() => questions.filter((q) => q.answers.length > 0), [questions]);

  const handleAskAi = useCallback(async (question: QuestionWithMeta) => {
    try {
      setAiLoadingId(question.id);
      setAiAnswer(null);
      setAiQuestionId(question.id);

      const res = await fetch("/api/ai-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: question.title, description: question.description }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setAiAnswer(data.answer ?? "No answer generated.");
      setAiModalOpen(true);
    } catch (error) {
      console.error(error);
      setAiAnswer("Sorry, the AI could not generate an answer right now.");
      setAiModalOpen(true);
    } finally {
      setAiLoadingId(null);
    }
  }, []);

  return (
    <>
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-12 pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <SplitText
                text={sessionName}
                className="text-3xl font-semibold tracking-tight text-foreground"
                delay={80}
                duration={0.5}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 24 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-80px"
                textAlign="left"
              />
              {membershipNotice ? <p className="text-sm text-muted-foreground">{membershipNotice}</p> : null}
            </div>

            <AskQuestionForm
              sessionId={sessionId}
              groupId={groupId}
              canAsk={permissions.canAsk}
              banMessage={permissions.banMessage ?? membershipNotice}
            />
          </div>

          {questions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
              No questions yet. Be the first to ask.
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Unanswered ({unanswered.length})</h2>
                </div>
                <ul className="space-y-4">
                  {unanswered.map((q) => (
                    <li key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                      <p className="text-xs text-muted-foreground">{q.authorName} asked</p>
                      <h3 className="mt-1 text-lg font-semibold text-foreground">{q.title}</h3>
                      {q.description ? <p className="mt-1 text-sm text-muted-foreground">{q.description}</p> : null}

                      {q.attachments.length > 0 ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {q.attachments.map((a) => (
                            <AttachmentPreview key={a.id} attachment={a} />
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-center gap-3 text-sm">
                        <AnswerQuestionForm
                          questionId={q.id}
                          sessionId={sessionId}
                          groupId={groupId}
                          canAnswer={permissions.canAnswer}
                          banMessage={permissions.banMessage ?? membershipNotice}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => handleAskAi(q)} disabled={aiLoadingId === q.id}>
                          {aiLoadingId === q.id ? "Asking AI..." : "Let AI answer"}
                        </Button>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Created {new Date(q.created_at).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Answered ({answered.length})</h2>
                <ul className="space-y-4">
                  {answered.map((q) => (
                    <li key={q.id} className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{q.authorName} asked</p>
                        <h3 className="text-lg font-semibold text-foreground">{q.title}</h3>
                        {q.description ? <p className="text-sm text-muted-foreground">{q.description}</p> : null}
                        {q.attachments.length > 0 ? (
                          <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {q.attachments.map((a) => (
                              <AttachmentPreview key={a.id} attachment={a} />
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {q.answers.map((answer) => (
                        <div key={answer.id} className="space-y-2 rounded-lg border border-border bg-muted p-3">
                          <div className="text-xs text-muted-foreground">
                            {answer.authorName} answered • {new Date(answer.created_at).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </div>
                          <p className="text-sm text-foreground">{answer.answer}</p>
                          {answer.attachments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        <Button type="button" variant="outline" size="sm" onClick={() => handleAskAi(q)} disabled={aiLoadingId === q.id}>
                          {aiLoadingId === q.id ? "Asking AI..." : "Let AI answer"}
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground">Created {new Date(q.created_at).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </main>

      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-lg bg-card p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">AI answer</h2>
              <button type="button" onClick={() => setAiModalOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Close
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm">{aiAnswer ?? "Waiting for answer..."}</div>
            {aiQuestionId !== null && <p className="mt-2 text-[11px] text-muted-foreground">This answer is generated for question ID {aiQuestionId}.</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default QnAClient;
