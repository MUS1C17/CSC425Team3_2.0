import Link from "next/link";
import { redirect } from "next/navigation";

import { JoinSessionButton } from "@/components/join-session-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

type GroupPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { groupId } = await params;
  const parsedGroupId = Number(groupId);

  if (!Number.isFinite(parsedGroupId)) {
    redirect("/groups");
  }

  const supabase = await createClient();

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claims?.claims) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [
    { data: group, error: groupError },
    { data: membership },
    { data: sessions, error: sessionsError },
  ] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name, description, join_code, join_link, created_at")
      .eq("id", parsedGroupId)
      .maybeSingle(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", parsedGroupId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("sessions")
      .select("id, name, description, start_time, end_time, created_at, deleted_at")
      .eq("group_id", parsedGroupId)
      .order("created_at", { ascending: false }),
  ]);

  if (groupError) {
    throw new Error(groupError.message);
  }
  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  if (!group) {
    redirect("/groups");
  }

  const filteredSessions = (sessions ?? []).filter((session) => !session.deleted_at);

  const sessionIds = filteredSessions.map((session) => session.id);

  const { data: mySessionMemberships, error: sessionMembershipsError } = sessionIds.length
    ? await supabase
        .from("session_members")
        .select("session_id, role")
        .eq("user_id", user.id)
        .in("session_id", sessionIds)
    : { data: [], error: null };

  if (sessionMembershipsError) {
    throw new Error(sessionMembershipsError.message);
  }

  const sessionMembershipMap = new Map<number, string>();
  (mySessionMemberships ?? []).forEach((row) => {
    sessionMembershipMap.set(row.session_id, row.role ?? "");
  });

  const role = membership?.role ?? null;
  const isOwner = role === "owner";
  const isModerator = role === "moderator";
  const isMember = Boolean(role);

  if (!isMember) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Join this group to continue</CardTitle>
            <CardDescription>
              You’re not a member of this group. Use the join code or link shared with you to gain
              access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/groups/join">Enter join code</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold">{group.name}</h1>
              <Badge variant="secondary">{role}</Badge>
            </div>
            {group.description ? (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Created {new Date(group.created_at).toLocaleString()}
            </p>
          </div>

          {isOwner ? (
            <div className="flex flex-col items-start gap-3">
              <Button asChild>
                <Link href={`/groups/${parsedGroupId}/sessions/new`}>Create session</Link>
              </Button>
              <div className="text-xs text-muted-foreground">
                Share code <span className="font-semibold text-foreground">{group.join_code}</span>
                {group.join_link ? (
                  <>
                    {" "}
                    or
                    <br />
                    <Link
                      href={group.join_link}
                      className="font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                      send {group.join_link}
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <Card className="bg-card">
          <CardHeader className="space-y-1">
            <CardTitle>Sessions</CardTitle>
            <CardDescription>
              Join a session to participate in live Q&amp;A or review past conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!filteredSessions.length ? (
              <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                {isOwner
                  ? "No sessions yet. Create your first session to start collecting questions."
                  : "No sessions are available yet. Check back once your instructor creates one."}
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredSessions.map((session) => {
                  const membershipRole = sessionMembershipMap.get(session.id) ?? null;
                  const alreadyJoined = Boolean(membershipRole);
                  const qnaHref = `/groups/${parsedGroupId}/sessions/${session.id}/qna`;

                  return (
                    <li
                      key={session.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold">{session.name}</h2>
                          {membershipRole ? (
                            <Badge variant="outline">{membershipRole}</Badge>
                          ) : null}
                        </div>
                        {session.description ? (
                          <p className="text-sm text-muted-foreground">{session.description}</p>
                        ) : null}
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>Created {new Date(session.created_at).toLocaleString()}</span>
                          {session.start_time ? (
                            <span>Starts {new Date(session.start_time).toLocaleString()}</span>
                          ) : null}
                          {session.end_time ? (
                            <span>Ends {new Date(session.end_time).toLocaleString()}</span>
                          ) : null}
                        </div>
                      </div>
                      <JoinSessionButton
                        sessionId={session.id}
                        qnaHref={qnaHref}
                        alreadyJoined={alreadyJoined || isOwner || isModerator}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
