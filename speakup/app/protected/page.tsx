import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UsersIcon, CalendarDaysIcon, MessageSquareIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import Image from "next/image";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

//helpers
function getSessionStatus(start?: string | null, end?: string | null) {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;

  if (s && e && now >= s && now <= e)
    return { label: "Live now", cls: "bg-emerald-100 text-emerald-700" };
  if (s && now < s) return { label: "Upcoming", cls: "bg-blue-100 text-blue-700" };
  return { label: "Past", cls: "bg-neutral-100 text-neutral-700" };
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims) redirect("/auth/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  type GroupMembershipRow = {
    role: string | null;
    groups: {
      id: number;
      name: string;
      description: string | null;
      created_at: string;
      deleted_at?: string | null;
    } | null;
  };

  type SessionMembershipRow = {
    role: string | null;
    sessions: {
      id: number;
      group_id: number;
      name: string;
      start_time: string | null;
      end_time: string | null;
      created_at: string;
      deleted_at?: string | null;
    } | null;
  };

  type QuestionRow = {
    id: number;
    title: string | null;
    created_at: string;
    session_id: number | null;
  };

  const [groupMembershipResp, sessionMembershipResp, questionsResp] = await Promise.all([
    supabase
      .from("group_members")
      .select("role, groups:groups(id, name, description, created_at, deleted_at)")
      .eq("user_id", user.id)
      .is("groups.deleted_at", null)
      .order("created_at", { ascending: false, foreignTable: "groups" })
      .limit(4),
    supabase
      .from("session_members")
      .select(
        "role, sessions:sessions(id, group_id, name, start_time, end_time, created_at, deleted_at)",
      )
      .eq("user_id", user.id)
      .is("sessions.deleted_at", null)
      .order("start_time", { ascending: false, foreignTable: "sessions" })
      .limit(4),
    supabase
      .from("questions")
      .select("id, title, created_at, session_id")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (groupMembershipResp.error) {
    throw new Error(groupMembershipResp.error.message);
  }
  if (sessionMembershipResp.error) {
    throw new Error(sessionMembershipResp.error.message);
  }
  if (questionsResp.error) {
    throw new Error(questionsResp.error.message);
  }

  const groupMembershipRows = (groupMembershipResp.data ?? []) as unknown as GroupMembershipRow[];
  const sessionMembershipRows = (sessionMembershipResp.data ??
    []) as unknown as SessionMembershipRow[];
  const questionRows = (questionsResp.data ?? []) as unknown as QuestionRow[];

  const questionIds = questionRows.map((q) => q.id);
  const answeredQuestionIds = new Set<number>();

  if (questionIds.length > 0) {
    const { data: answerRows, error: answersError } = await supabase
      .from("answers")
      .select("question_id")
      .in("question_id", questionIds);

    if (answersError) {
      throw new Error(answersError.message);
    }

    (answerRows ?? []).forEach((row) => {
      if (row?.question_id) {
        answeredQuestionIds.add(row.question_id);
      }
    });
  }

  const groups = (groupMembershipRows ?? [])
    .map((row) =>
      row.groups
        ? {
            ...row.groups,
            role: row.role ?? "member",
          }
        : null,
    )
    .filter(Boolean) as Array<{
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    role: string;
  }>;

  const sessions = (sessionMembershipRows ?? [])
    .map((row) =>
      row.sessions
        ? {
            ...row.sessions,
            role: row.role ?? "attendee",
          }
        : null,
    )
    .filter(Boolean) as Array<{
    id: number;
    group_id: number;
    name: string;
    start_time: string | null;
    end_time: string | null;
    created_at: string;
    role: string;
  }>;

  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user?.id)
    .maybeSingle();

  const firstName = profile?.first_name ?? "there";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold text-primary mb-4 text-center">Welcome to Your Dashboard!</h1>
      <p className="text-lg text-accent-foreground mb-6 text-center">
        Ready to test your knowledge? Answer questions, track your progress, and have fun learning!
      </p>
      <div className="w-full max-w-md rounded-2xl bg-card shadow-lg p-6 flex flex-col items-center">
        <Image
          src="/fun-classroom.png"
          alt="Cartoon student raising hand to answer a question in class"
          width={320}
          height={200}
          className="rounded-xl mb-4 border-2 border-accent shadow"
        />
        <span className="text-base text-muted-foreground text-center">
          "Don't be shy! Give your best answer and see how you stack up."
        </span>
      </div>
      <div className="flex flex-col gap-10">
        {/* Header actions (no greeting text) */}
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <Label htmlFor="greeting" className="text-2xl font-bold">
              Hey, {firstName}
            </Label>
            <Label htmlFor="description" className="text-sm text-muted-foreground mt-1">
              Jump back into your classes, lectures, and Q&amp;A — without interrupting the professor.
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/groups/join">
              <Button variant="outline">Join Group</Button>
            </Link>
            <Link href="/groups/new">
              <Button data-cy="createGroupButton">Create Group</Button>
            </Link>
          </div>
        </div>

        {/* Top cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Groups */}
          <Card className="bg-card">
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4" />
                <CardTitle>Your Groups</CardTitle>
              </div>
              <Link
                href="/groups"
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                View all <ChevronRight className="size-4 translate-y-[1px]" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {!groups.length ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  You’re not in any groups yet. Join one with a code, or create a new class.
                </div>
              ) : (
                groups.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-md border p-4 flex items-center justify-between hover:bg-muted/40 transition"
                  >
                    <div>
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.description ?? "—"}</div>
                      <div className="text-xs text-muted-foreground capitalize">Role: {g.role}</div>
                    </div>
                    <Link href={`/groups/${g.id}`}>
                      <Button variant="outline" size="sm">
                        Go to Group
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card className="bg-card">
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="size-4" />
                <CardTitle>Recent Sessions</CardTitle>
              </div>
              <Link
                href="/recent-sessions"
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                View all <ChevronRight className="size-4 translate-y-[1px]" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {!sessions.length ? (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  No sessions yet. When a professor starts a lecture, it’ll show up here.
                </div>
              ) : (
                sessions.map((s) => {
                  const badge = getSessionStatus(s.start_time, s.end_time);
                  return (
                    <div
                      key={s.id}
                      className="rounded-md border p-4 flex items-start justify-between gap-3 hover:bg-muted/40 transition"
                    >
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.start_time ? new Date(s.start_time).toLocaleString() : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">Role: {s.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <Link href={`/groups/${s.group_id}/sessions/${s.id}/qna`}>
                          <Button size="sm">Open Q&amp;A</Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity */}
        <Card className="bg-card">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="size-4" />
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Track your questions and answers.</CardDescription>
              </div>
            </div>
            <Link
              href="/questions"
              className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              View all <ChevronRight className="size-4 translate-y-[1px]" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <button className="text-sm px-3 py-1.5 rounded-md bg-muted">My Questions</button>
              <button className="text-sm px-3 py-1.5 rounded-md hover:bg-muted">Unanswered</button>
              <button className="text-sm px-3 py-1.5 rounded-md hover:bg-muted">Pinned</button>
            </div>

            {!questionRows?.length ? (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                No questions yet. Ask away during your next session — without interrupting.
              </div>
            ) : (
              questionRows.map((q) => (
                <Link
                  key={q.id}
                  href={q.session_id ? `/sessions/${q.session_id}?q=${q.id}` : `/questions/${q.id}`}
                  className="rounded-md border p-4 block hover:bg-muted/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium line-clamp-1">{q.title ?? "Untitled question"}</div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        answeredQuestionIds.has(q.id)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {answeredQuestionIds.has(q.id) ? "Answered" : "Waiting"}
                    </span>
                  </div>
                </Link>
              ))
            )}

            <div className="pt-2">
              <Link href="/sessions/live">
                <Button>Join Live Session</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
