import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreateSessionForm from "@/components/create-session-form";
import { createClient } from "@/lib/supabase/server";

type NewSessionPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<{
    joinCode?: string;
    joinLink?: string;
    groupCreated?: string;
  }>;
};

export default async function NewSessionPage({ params, searchParams }: NewSessionPageProps) {
  const { groupId } = await params;
  const resolvedSearchParams = (searchParams && (await searchParams)) ?? {};

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

  const [{ data: group, error: groupError }, { data: membership }] = await Promise.all([
    supabase.from("groups").select("id, name, description").eq("id", parsedGroupId).maybeSingle(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", parsedGroupId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (groupError) {
    throw new Error(groupError.message);
  }

  if (!group) {
    redirect("/groups");
  }

  if (!membership || (membership.role ?? "") !== "owner") {
    redirect(`/groups/${parsedGroupId}`);
  }

  const joinCode = resolvedSearchParams.joinCode;
  const joinLink = resolvedSearchParams.joinLink;
  const showCreatedNotice = resolvedSearchParams.groupCreated === "1" && joinCode;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Create sessions for {group.name}</h1>
            <p className="text-sm text-muted-foreground">
              Sessions are where questions and answers live. Create as many as you need for
              lectures, office hours, or recurring classes.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/groups/${parsedGroupId}`}>Back to group</Link>
          </Button>
        </div>

        {showCreatedNotice ? (
          <div className="rounded-md border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600" data-cy="groupCreatedMessage">
            Group created! Share code <span className="font-semibold">{joinCode}</span>
            {joinLink ? (
              <>
                {" "}
                or invite with{" "}
                <Link href={joinLink} className="font-semibold underline-offset-2 hover:underline">
                  your join link
                </Link>
                .
              </>
            ) : (
              "."
            )}
          </div>
        ) : null}

        <Card className="bg-card">
          <CardHeader className="space-y-1">
            <CardTitle>New session</CardTitle>
            <CardDescription>
              Provide the details students need. You can set start and end times to help them know
              when to join live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateSessionForm groupId={parsedGroupId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
