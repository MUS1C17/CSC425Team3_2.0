import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

export default async function GroupsIndexPage() {
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

  const { data: membershipRows, error: membershipError } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user.id);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const groupIds = membershipRows?.map((row) => row.group_id) ?? [];
  const roleMap = new Map<number, string>();
  membershipRows?.forEach((row) => {
    roleMap.set(row.group_id, row.role ?? "");
  });

  const { data: groups, error: groupsError } = groupIds.length
    ? await supabase
        .from("groups")
        .select("id, name, description, created_at")
        .in("id", groupIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (groupsError) {
    throw new Error(groupsError.message);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your spaces</h1>
          <p className="text-sm text-foreground/80">Create a new class, or jump into an existing one with your join code.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/groups/join">Join group</Link>
          </Button>
          <Button asChild>
            <Link href="/groups/new">Create group</Link>
          </Button>
        </div>
      </div>

      {!groups?.length ? (
        <Card className="bg-card/60 border border-white/10 md:rotate-1">
          <CardHeader>
            <CardTitle>No groups yet</CardTitle>
            <CardDescription>When you create or join a group, it will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/groups/new">Create your first group</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/groups/join">Enter join code</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {groups.map((group) => {
            const role = roleMap.get(group.id) ?? "member";
            return (
              <li key={group.id}>
                <Card className="h-full bg-card/60 border border-white/10 md:rotate-[0.5deg]">
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      {group.description ? (
                        <CardDescription>{group.description}</CardDescription>
                      ) : null}
                    </div>
                    <Badge variant="secondary">{role}</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(group.created_at).toLocaleString()}
                    </p>
                    <Button asChild variant="outline">
                      <Link href={`/groups/${group.id}`}>Open group</Link>
                    </Button>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
