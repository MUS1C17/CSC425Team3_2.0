//server side component

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import QnAClient from "./QnAClient";
import { Question } from "@/lib/types/question";
import { Answer } from "@/lib/types/answer";
import { QuestionAttachment } from "@/lib/types/QuestionAttachment";
import { AnswerAttachment } from "@/lib/types/AnswerAttachment";

//defining my component specific types
type SessionMemberRow = {
  role: string | null;
};

type GroupMemberRow = {
  role: string | null;
};

type BanRow = {
  reason: string | null;
  ban_until: string | null;
};

type EnrichedAnswer = Answer & {
  authorName: string;
  attachments: AnswerAttachment[];
};

type EnrichedQuestion = Omit<Question, "description"> & {
  description: string | null;
  authorName: string;
  attachments: QuestionAttachment[];
  answers: EnrichedAnswer[];
};

export default async function QuestionsAndAnswers({
  params,
}: {
  params: Promise<{ groupId: string; sessionId: string }>;
}) {
  const { groupId, sessionId } = await params;
  const parsedGroupId = Number(groupId);
  const parsedSessionId = Number(sessionId);

  if (!Number.isFinite(parsedGroupId) || !Number.isFinite(parsedSessionId)) {
    notFound();
  }

  const supabase = await createClient();
  const service = createServiceClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session, error: sessionError } = await service
    .from("sessions")
    .select("id, group_id, deleted_at, name")
    .eq("id", parsedSessionId)
    .maybeSingle();

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  if (!session || session.group_id !== parsedGroupId || session.deleted_at) {
   notFound();
  }

  let sessionMember: SessionMemberRow | null = null;
  let groupMember: GroupMemberRow | null = null;
  let activeSessionBan: BanRow | null = null;
  let activeGroupBan: BanRow | null = null;

  if (user) {
    const [sessionMemberRes, groupMemberRes, sessionBansRes, groupBansRes] = await Promise.all([
      service
        .from("session_members")
        .select("role")
        .eq("session_id", parsedSessionId)
        .eq("user_id", user.id)
        .maybeSingle(),
      service
        .from("group_members")
        .select("role")
        .eq("group_id", parsedGroupId)
        .eq("user_id", user.id)
        .maybeSingle(),
      service
        .from("session_bans")
        .select("reason, ban_until")
        .eq("session_id", parsedSessionId)
        .eq("user_id", user.id),
      service
        .from("group_bans")
        .select("reason, ban_until")
        .eq("group_id", parsedGroupId)
        .eq("user_id", user.id),
    ]);

    if (sessionMemberRes.error) {
      throw new Error(sessionMemberRes.error.message);
    }
    if (groupMemberRes.error) {
      throw new Error(groupMemberRes.error.message);
    }
    if (sessionBansRes.error) {
      throw new Error(sessionBansRes.error.message);
    }
    if (groupBansRes.error) {
      throw new Error(groupBansRes.error.message);
    }

    sessionMember = sessionMemberRes.data;
    groupMember = groupMemberRes.data;

    const now = Date.now();
    activeSessionBan =
      (sessionBansRes.data ?? []).find(
        (ban) => !ban.ban_until || new Date(ban.ban_until).getTime() > now,
      ) ?? null;
    activeGroupBan =
      (groupBansRes.data ?? []).find(
        (ban) => !ban.ban_until || new Date(ban.ban_until).getTime() > now,
      ) ?? null;
  }

  const groupPrivilegedRoles = new Set(["owner", "moderator"]);
  const sessionAnswerRoles = new Set(["host", "moderator"]);

  const isSessionMember = Boolean(sessionMember);
  const isGroupPrivileged = groupMember ? groupPrivilegedRoles.has(groupMember.role ?? "") : false;
  const isBanned = Boolean(activeSessionBan || activeGroupBan);
  const canAsk = Boolean(user && isSessionMember && !isBanned); //the user canAsk if authenticased, are members of the session and isnt banned
  const canAnswer = Boolean(
    user &&
      !isBanned &&
      ((sessionMember && sessionAnswerRoles.has(sessionMember.role ?? "")) || isGroupPrivileged),
  );

  const banRecord = activeSessionBan ?? activeGroupBan;
  const banMessage = banRecord
    ? `You are banned${banRecord.reason ? `: ${banRecord.reason}` : ""}${
        banRecord.ban_until ? ` until ${new Date(banRecord.ban_until).toLocaleString()}` : ""
      }`
    : null;

  //getting questions
  const { data: questionRows, error: questionsError } = await service
    .from("questions")
    .select("id, session_id, author_id, title, description, created_at")
    .eq("session_id", parsedSessionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (questionsError) {
    throw new Error(questionsError.message);
  }

  const questionIds = (questionRows ?? []).map((q) => q.id);

  //getting answers
  const { data: answerRows, error: answersError } =
    questionIds.length > 0
      ? await service
          .from("answers")
          .select("id, question_id, author_id, answer, created_at")
          .in("question_id", questionIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

  if (answersError) {
    throw new Error(answersError.message);
  }

  const answerIds = (answerRows ?? []).map((a) => a.id);

  //fetching question and answer attachments
  const [questionAttachmentsRes, answerAttachmentsRes] = await Promise.all([
    questionIds.length > 0
      ? service
          .from("question_attachments")
          .select(
            "id, question_id, storage_bucket, storage_path, mime_type, byte_size, position, uploaded_by, created_at",
          )
          .in("question_id", questionIds)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    answerIds.length > 0
      ? service
          .from("answer_attachments")
          .select(
            "id, answer_id, storage_bucket, storage_path, mime_type, byte_size, position, uploaded_by, created_at",
          )
          .in("answer_id", answerIds)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (questionAttachmentsRes.error) {
    throw new Error(questionAttachmentsRes.error.message);
  }
  if (answerAttachmentsRes.error) {
    throw new Error(answerAttachmentsRes.error.message);
  }

  const questionAttachments = (questionAttachmentsRes.data ?? []) as any[];
  const answerAttachments = (answerAttachmentsRes.data ?? []) as any[];

  const questionAttachmentMap: Record<string, any[]> = {};
  questionAttachments.forEach((attachment) => {
    const { data } = service.storage
      .from(attachment.storage_bucket)
      .getPublicUrl(attachment.storage_path);
    const formatted = {
      ...attachment,
      publicUrl: data.publicUrl,
    };

    const qid = String(attachment.question_id);
    if (!questionAttachmentMap[qid]) {
      questionAttachmentMap[qid] = [];
    }
    questionAttachmentMap[qid].push(formatted);
  });

  const answerAttachmentMap: Record<string, any[]> = {};
  answerAttachments.forEach((attachment) => {
    const { data } = service.storage
      .from(attachment.storage_bucket)
      .getPublicUrl(attachment.storage_path);
    const formatted = {
      ...attachment,
      publicUrl: data.publicUrl,
    };
    const aid = String(attachment.answer_id);
    if (!answerAttachmentMap[aid]) {
      answerAttachmentMap[aid] = [];
    }
    answerAttachmentMap[aid].push(formatted);
  });

  //making a set of userId's
  const userIds = new Set<string>();
  (questionRows ?? []).forEach((q) => userIds.add(q.author_id));
  (answerRows ?? []).forEach((a) => userIds.add(a.author_id));

  const { data: userRows, error: usersError } =
    userIds.size > 0
      ? await service
          .from("users")
          .select("id, first_name, last_name")
          .in("id", Array.from(userIds))
      : { data: [], error: null };

  if (usersError) {
    throw new Error(usersError.message);
  }

  const userNameMap: Record<string, string> = {};
  ((userRows ?? []) as any[]).forEach((u) => {
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    userNameMap[String(u.id)] = fullName || "Unknown";
  });

  //formatting answers
  const answersByQuestion = new Map<string, EnrichedAnswer[]>();

  (((answerRows ?? []) as any[]) ?? []).forEach((answer: any) => {
    const enriched: EnrichedAnswer = {
      ...answer,
      authorName: userNameMap[answer.author_id] ?? "Unknown",
      attachments: answerAttachmentMap[String(answer.id)] ?? [],
    };
    const qkey = String(answer.question_id);
    const existing = answersByQuestion.get(qkey) ?? [];
    existing.push(enriched);
    answersByQuestion.set(qkey, existing);
  });

  //formatting questions
  const questionsWithRelations: EnrichedQuestion[] = ((questionRows ?? []) as any[]).map(
    (question: any) => ({
      ...question,
      description: question.description ?? null,
      authorName: userNameMap[String(question.author_id)] ?? "Unknown",
      attachments: questionAttachmentMap[String(question.id)] ?? [],
      answers: (answersByQuestion.get(String(question.id)) ?? []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    }),
  );

  //informing users
  const membershipNotice = !user
    ? "Sign in to participate in the Q&A."
    : (banMessage ?? (!isSessionMember ? "You must join this session to ask questions." : null));

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-4xl h-[85vh] overflow-y-auto rounded-2xl shadow-lg bg-white p-6">
        <QnAClient
          sessionId={parsedSessionId}
          groupId={parsedGroupId}
          sessionName={session.name}
          questions={questionsWithRelations as any}
          permissions={{
            canAsk,
            canAnswer,
            isSessionMember,
            banMessage,
            banUntil: banRecord?.ban_until ?? null,
            requiresLogin: !user,
          }}
          membershipNotice={membershipNotice}
        />
      </div>
    </div>
  );
}
