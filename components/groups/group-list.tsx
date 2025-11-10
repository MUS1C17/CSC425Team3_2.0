import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function GroupList() {
  const supabase = createServerClient();

  const groupsResp = await supabase
    .from("groups")
    .select(`
      *,
      group_members (
        user_id,
        role
      ),
      sessions (
        id
      )
    `);

  const groups = (groupsResp.data ?? []) as any[];
  const error = groupsResp.error;

  if (error) {
    return <div>Error loading groups: {error.message}</div>;
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">No groups found</h3>
        <p className="text-muted-foreground mt-2">Create a new group to get started</p>
        <Button asChild className="mt-4">
          <Link href="/groups/new">Create Group</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Link href={`/groups/${group.id}`} className="hover:underline">
                {group.name}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <p>{group.group_members?.length || 0} members</p>
                <p>{group.sessions?.length || 0} sessions</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/groups/${group.id}`}>View Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}