import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon, UsersIcon, CalendarDaysIcon, MessageSquareIcon } from "lucide-react";
import {ChevronRight} from "lucide-react"
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

//helpers
function getSessionStatus(start?: string | null, end?: string | null) {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;

  if (s && e && now >= s && now <= e) return { label: "Live now", cls: "bg-emerald-100 text-emerald-700" };
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

  const {data: { user }, } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("first_name").eq("id", user?.id).maybeSingle();
  const firstName = profile?.first_name ?? "there";

  return (
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
            <Button>Create Group</Button>
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
            <Link href="/groups" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
              View all <ChevronRight className="size-4 translate-y-[1px]" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!groups?.length ? (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                You’re not in any groups yet. Join one with a code, or create a new class.
              </div>
            ) : (
              groups.map((g: any) => (
                <div key={g.id} className="rounded-md border p-4 flex items-center justify-between hover:bg-muted/40 transition">
                  <div>
                    <div className="font-medium">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.instructor_name ?? "—"}</div>
                  </div>
                  <Link href={`/groups/${g.id}`}><Button variant="outline" size="sm">Go to Group</Button></Link>
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
            <Link href="/recent-sessions" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
              View all <ChevronRight className="size-4 translate-y-[1px]" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!sessions?.length ? (
              <div className="rounded-md border p-4 text-sm text-muted-foreground">
                No sessions yet. When a professor starts a lecture, it’ll show up here.
              </div>
            ) : (
              sessions.map((s: any) => {
                const badge = getSessionStatus(s.start_time, s.end_time);
                return (
                  <div key={s.id} className="rounded-md border p-4 flex items-start justify-between gap-3 hover:bg-muted/40 transition">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.start_time ? new Date(s.start_time).toLocaleString() : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${badge.cls}`}>{badge.label}</span>
                      <Link href={`/sessions/${s.id}`}><Button size="sm">View Questions</Button></Link>
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
          <Link href="/questions" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
            View all <ChevronRight className="size-4 translate-y-[1px]" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <button className="text-sm px-3 py-1.5 rounded-md bg-muted">My Questions</button>
            <button className="text-sm px-3 py-1.5 rounded-md hover:bg-muted">Unanswered</button>
            <button className="text-sm px-3 py-1.5 rounded-md hover:bg-muted">Pinned</button>
          </div>

          {!questions?.length ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No questions yet. Ask away during your next session — without interrupting.
            </div>
          ) : (
            questions.map((q: any) => (
              <Link
                key={q.id}
                href={q.session_id ? `/sessions/${q.session_id}?q=${q.id}` : `/questions/${q.id}`}
                className="rounded-md border p-4 block hover:bg-muted/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium line-clamp-1">{q.title ?? "Untitled question"}</div>
                  <span className={`text-xs px-2 py-1 rounded ${q.is_answered ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {q.is_answered ? "Answered" : "Unanswered"}
                  </span>
                </div>
              </Link>
            ))
          )}

          <div className="pt-2">
            <Link href="/sessions/live"><Button>Join Live Session</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}