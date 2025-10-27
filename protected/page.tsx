import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UsersIcon, CalendarDaysIcon, MessageSquareIcon, ChevronRight } from "lucide-react";

function getSessionStatus(start?: string | null, end?: string | null) {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && e && now >= s && now <= e) return { label: "Live now", cls: "bg-emerald-200 text-emerald-800" };
  if (s && now < s) return { label: "Upcoming", cls: "bg-blue-200 text-blue-800" };
  return { label: "Past", cls: "bg-gray-200 text-gray-700" };
}

export default async function Dashboard() {
  const supabase = createServerClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims) redirect("/auth/login");

  const [{ data: groups }, { data: sessions }, { data: questions }] = await Promise.all([
    supabase.from("groups").select("id, name, instructor_name, created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("sessions").select("id, name, group_id, start_time, end_time").order("start_time", { ascending: false }).limit(4),
    supabase.from("questions").select("id, title, is_answered, created_at, session_id").order("created_at", { ascending: false }).limit(6),
  ]).catch(() => [{ data: [] }, { data: [] }, { data: [] }]) as any;

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("first_name").eq("id", user?.id).maybeSingle();
  const firstName = profile?.first_name ?? "there";

  return (
    <div className="flex flex-col gap-12 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col gap-2">
          <Label htmlFor="greeting" className="text-3xl font-bold text-indigo-900">
            Hey, {firstName}
          </Label>
          <Label htmlFor="description" className="text-sm text-indigo-700">
            Jump back into your classes, lectures, and Q&amp;A — without interrupting the professor.
          </Label>
        </div>
        <div className="flex gap-3">
          <Link href="/groups/join">
            <Button variant="outline" className="hover:bg-indigo-100 hover:text-indigo-900">Join Group</Button>
          </Link>
          <Link href="/groups/new">
            <Button className="bg-indigo-600 text-white hover:bg-indigo-700">Create Group</Button>
          </Link>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Groups Card */}
        <Card className="bg-white shadow-md rounded-xl hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-700">
              <UsersIcon className="w-5 h-5" />
              <CardTitle>Your Groups</CardTitle>
            </div>
            <Link href="/groups" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!groups?.length ? (
              <div className="rounded-lg border p-4 text-sm text-gray-600 bg-gray-50">
                You’re not in any groups yet. Join one with a code, or create a new class.
              </div>
            ) : (
              groups.map((g: any) => (
                <div key={g.id} className="rounded-lg border p-4 flex items-center justify-between hover:bg-indigo-50 transition">
                  <div>
                    <div className="font-medium text-indigo-800">{g.name}</div>
                    <div className="text-xs text-gray-500">{g.instructor_name ?? "—"}</div>
                  </div>
                  <Link href={`/groups/${g.id}`}>
                    <Button variant="outline" size="sm">Go to Group</Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Sessions Card */}
        <Card className="bg-white shadow-md rounded-xl hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-700">
              <CalendarDaysIcon className="w-5 h-5" />
              <CardTitle>Recent Sessions</CardTitle>
            </div>
            <Link href="/recent-sessions" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!sessions?.length ? (
              <div className="rounded-lg border p-4 text-sm text-gray-600 bg-gray-50">
                No sessions yet. When a professor starts a lecture, it’ll show up here.
              </div>
            ) : (
              sessions.map((s: any) => {
                const badge = getSessionStatus(s.start_time, s.end_time);
                return (
                  <div key={s.id} className="rounded-lg border p-4 flex items-start justify-between gap-3 hover:bg-indigo-50 transition">
                    <div>
                      <div className="font-medium text-indigo-800">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.start_time ? new Date(s.start_time).toLocaleString() : "—"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                      <Link href={`/sessions/${s.id}`}>
                        <Button size="sm" variant="ghost">View Questions</Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Card */}
      <Card className="bg-white shadow-md rounded-xl hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-700">
            <MessageSquareIcon className="w-5 h-5" />
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription className="text-gray-500">Track your questions and answers.</CardDescription>
            </div>
          </div>
          <Link href="/questions" className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <button className="text-sm px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-800">My Questions</button>
            <button className="text-sm px-3 py-1.5 rounded-md hover:bg-indigo-50 text-indigo-700">Unanswered</button>
            <button className="text-sm px-3 py-1.5 rounded-md hover:bg-indigo-50 text-indigo-700">Pinned</button>
          </div>

          {!questions?.length ? (
            <div className="rounded-lg border p-4 text-sm text-gray-600 bg-gray-50">
              No questions yet. Ask away during your next session — without interrupting.
            </div>
          ) : (
            questions.map((q: any) => (
              <Link key={q.id} href={q.session_id ? `/sessions/${q.session_id}?q=${q.id}` : `/questions/${q.id}`} className="rounded-lg border p-4 block hover:bg-indigo-50 transition">
                <div className="flex items-center justify-between">
                  <div className="font-medium line-clamp-1 text-indigo-800">{q.title ?? "Untitled question"}</div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${q.is_answered ? "bg-emerald-200 text-emerald-800" : "bg-amber-200 text-amber-800"}`}>
                    {q.is_answered ? "Answered" : "Unanswered"}
                  </span>
                </div>
              </Link>
            ))
          )}

          <div className="pt-2">
            <Link href="/sessions/live">
              <Button className="bg-indigo-600 text-white hover:bg-indigo-700 w-full">Join Live Session</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
