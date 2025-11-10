//client side component

"use client";

import { useMemo } from "react";
import AskQuestionForm from "@/components/ask-question-form";
import AnswerQuestionForm from "@/components/answer-question-form";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import SplitText from "@/components/ui/split-text";

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
};

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.mime_type?.startsWith("image/") && attachment.publicUrl) {
    return (
      <div className="inline-flex items-center justify-center">
        <Image
          src={attachment.publicUrl!}
          alt={attachment.mime_type ?? "attachment"}
          width={1200} //large intrinsic size (any big placeholder)
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

export default function QnAClient({
  sessionId,
  groupId,
  sessionName,
  questions,
  permissions,
  membershipNotice,
}: QnAClientProps) {
  //flitering by answered and unanswered
  const unanswered = useMemo(() => questions.filter((q) => q.answers.length === 0), [questions]);
  const answered = useMemo(() => questions.filter((q) => q.answers.length > 0), [questions]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1>
            <SplitText
              text={sessionName}
              className="text-2xl font-bold text-purple-500"
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
            <p className="text-sm text-slate-500 mt-1">{membershipNotice}</p>
          ) : null}
        </div>

        <AskQuestionForm
          sessionId={sessionId}
          groupId={groupId}
          canAsk={permissions.canAsk}
          banMessage={permissions.banMessage ?? membershipNotice}
        />
      </div>

      {questions.length === 0 ? (
        <p className="text-slate-500">No questions yet.</p>
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
                <li key={q.id} className="border rounded-lg p-4">
                  <p className="text-xs text-slate-500">{q.authorName} asked</p>
                  <h3 className="font-semibold text-purple-500">{q.title}</h3>
                  {q.description ? <p className="text-sm text-slate-600">{q.description}</p> : null}

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
                <li key={q.id} className="border rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">{q.authorName} asked</p>
                    <h3 className="font-semibold text-purple-500">{q.title}</h3>
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
                    <div key={answer.id} className="bg-slate-50 border rounded-lg p-3 space-y-2">
                      <div className="text-xs text-slate-500">
                        {answer.authorName} answered •{" "}
                        {new Date(answer.created_at).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <p className="text-slate-600">{answer.answer}</p>
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
    </div>
  );
}
