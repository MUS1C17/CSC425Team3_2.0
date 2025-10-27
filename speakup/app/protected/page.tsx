import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsersIcon, CalendarDaysIcon, MessageSquareIcon, InfoIcon, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function getSessionStatus(start?: string | null, end?: string | null) {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && e && now >= s && now <= e) return { label: "Live", cls: "bg-emerald-100 text-emerald-700" };
  if (s && now < s) return { label: "Upcoming", cls: "bg-blue-100 text-blue-700" };
  return { label: "Past", cls: "bg-neutral-100 text-neutral-700" };
}

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims) redirect("/auth/login");

  const [{ data: groups }, { data: sessions }, { data: questions }] = await Promise.all([
    supabase.from("groups").select("id, name, instructor_name, created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("sessions").select("id, name, group_id, start_time, end_time").order("start_time", { ascending: false }).limit(4),
    supabase.from("questions").select("id, title, is_answered, created_at, session_id").order("created_at", { ascending: false }).limit(6),
  ]).catch(() => [{ data: [] }, { data: [] }, { data: [] }]) as any;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <Label className="text-xl font-semibold">Overview</Label>
        <div className="flex gap-2">
          <Link href="/groups/join"><Button variant="outline" size="sm">Join Group</Button></Link>
          <Link href="/groups/new"><Button size="sm">Create Group</Button></Link>
        </div>
      </div>

      {/* Groups */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              <CardTitle className="text-base">Groups</CardTitle>
            </div>
            <Link href="/groups" className="inline-flex items-center gap-1 text-sm hover:underline">
              See all <ChevronRight className="size-4 translate-y-[1px]" />
            </Link>
          </div>
          <CardDescription className="sr-only">Your most recent groups</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!groups?.length ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <InfoIcon className="size-4" />
              <span>No groups yet.</span>
            </div>
          ) : (
            <ul className="divide-y">
              {groups.map((g: any) => (
                <li key={g.id} className="group">
                  <Link href={`/groups/${g.id}`} className="flex items-center justify-between p-4 hover:bg-muted/40">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.instructor_name ?? "—"}</div>
                    </div>
                    <ChevronRight className="size-4 opacity-60 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="size-4" />
              <CardTitle className="text-base">Sessions</CardTitle>
            </div>
            <Link href="/recent-sessions" className="inline-flex items-center gap-1 text-sm hover:underline">
              See all <ChevronRight className="size-4 translate-y-[1px]" />
            </Link>
          </div>
          <CardDescription className="sr-only">Recent sessions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!sessions?.length ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <InfoIcon className="size-4" />
              <span>No sessions yet.</span>
            </div>
          ) : (
            <ul className="divide-y">
              {sessions.map((s: any) => {
                const badge = getSessionStatus(s.start_time, s.end_time);
                return (
                  <li key={s.id} className="group">
                    <Link href={`/sessions/${s.id}`} className="flex items-center justify-between p-4 hover:bg-muted/40">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.start_time ? new Date(s.start_time).toLocaleString() : "—"}
                        </div>
                      </div>
                      <span className={`ml-4 shrink-0 rounded px-2 py-0.5 text-xs ${badge.cls}`}>{badge.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="size-4" />
              <CardTitle className="text-base">Activity</CardTitle>
            </div>
            <Link href="/questions" className="inline-flex items-center gap-1 text-sm hover:underline">
              See all <ChevronRight className="size-4 translate-y-[1px]" />
            </Link>
          </div>
          <CardDescription className="sr-only">Recent questions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!questions?.length ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <InfoIcon className="size-4" />
              <span>No questions yet.</span>
            </div>
          ) : (
            <ul className="divide-y">
              {questions.map((q: any) => (
                <li key={q.id} className="group">
                  <Link
                    href={q.session_id ? `/sessions/${q.session_id}?q=${q.id}` : `/questions/${q.id}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{q.title ?? "Untitled question"}</div>
                    </div>
                    <span
                      className={`ml-4 shrink-0 rounded px-2 py-0.5 text-xs ${
                        q.is_answered ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {q.is_answered ? "Answered" : "Unanswered"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="p-4">
            <Link href="/sessions/live"><Button className="w-full">Join Live Session</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
