'use client';
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon } from "lucide-react";
import DatePickerInput from "@/components/ui/date-picker-input";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function SessionsPage() {
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("Profile");
  const router = useRouter();
  const [userGroups, setUserGroups] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      setLoading(true);
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setSessions([]);
        setLoading(false);
        return;
      }
      let query = supabase
        .from("session_members")
        .select("role, session_id, sessions(id, name, created_at, group_id, deleted_at)")
        .eq("user_id", userData.user.id);
      if (nameFilter) {
        //Only show sessions where the name starts with the filter (case-insensitive)
        query = query.ilike("sessions.name", `${nameFilter}%`);
      }
      if (dateFilter) {
        //Filter sessions created on the selected date (regardless of time)
        const start = new Date(dateFilter);
        const end = new Date(dateFilter);
        end.setDate(end.getDate() + 1);
        query = query.gte("sessions.created_at", start.toISOString()).lt("sessions.created_at", end.toISOString());
      }
      const { data: sessionMembershipRows, error: sessionMembershipsError } = await query;
      if (sessionMembershipsError) {
        setSessions([]);
        setLoading(false);
        return;
      }
      const sessionsRaw = (sessionMembershipRows ?? [])
        .map((row: any) => row.sessions && !row.sessions.deleted_at ? { ...row.sessions, role: row.role } : null)
        .filter((s: any): s is any => !!s);
      const groupIds = Array.from(new Set(sessionsRaw.map((s: any) => s.group_id).filter(Boolean)));
      let groupsMap = new Map();
      if (groupIds.length > 0) {
        const { data: groupsRows } = await supabase
          .from("groups")
          .select("id, name, created_at")
          .in("id", groupIds);
        (groupsRows ?? []).forEach((g: any) => groupsMap.set(g.id, g));
      }
      setSessions(sessionsRaw.map((s: any) => ({
        id: s.id,
        name: s.name,
        created_at: s.created_at,
        group: s.group_id ? groupsMap.get(s.group_id) : null,
        role: s.role,
      })));
      setLoading(false);
    }
    fetchSessions();
  }, [nameFilter, dateFilter]);

  useEffect(() => {
    async function fetchAvatar() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: profile } = await supabase
        .from("users")
        .select("avatar_path, first_name, last_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      setAvatarUrl(profile?.avatar_path ?? null);
      setFullName(
        profile && (profile.first_name || profile.last_name)
          ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
          : "Profile"
      );
    }
    fetchAvatar();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  useEffect(() => {
    async function fetchGroups() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const { data: groups } = await supabase
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", userData.user.id);
      setUserGroups((groups ?? []).map((g: any) => g.groups).filter(Boolean));
    }
    fetchGroups();
  }, []);

  return (
    <div className="flex flex-col gap-10">
      {/* Navigation grid */}
      <nav className="w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 h-16">
          <div className="flex items-center gap-3 sm:gap-4 font-medium">
            <Link href="/protected" className="text-lg font-semibold">
              SpeakUp
            </Link>
            <Button asChild variant="ghost" className="h-9 px-3">
              <Link href="/groups">Groups</Link>
            </Button>
            <Button asChild variant="ghost" className="h-9 px-3 bg-muted text-foreground">
              <Link href="/sessions">Sessions</Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full border border-border hover:bg-muted transition grid place-items-center" aria-label="Open profile menu">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ThemeSwitcher asChild className="px-2 py-2">Change theme</ThemeSwitcher>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      {/* New split layout: left filters, right list */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-4">
          <Label className="text-2xl font-bold">Your Sessions</Label>
          <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="text"
              name="name"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Filter by session name..."
            />
            <DatePickerInput value={dateFilter} onChange={setDateFilter} />
          </form>
          {/* Quick actions */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/10 p-4 bg-white/5 backdrop-blur-sm">
              <div className="text-sm font-medium mb-2">Quick create</div>
              <div className="space-y-2">
                {userGroups.length > 0 && (
                  <Button variant="outline" className="w-full" onClick={() => router.push("/sessions/new")}>New session</Button>
                )}
                <Button className="w-full" onClick={() => router.push("/groups/new")}>New group</Button>
              </div>
            </div>
          </div>
        </aside>
        <section className="lg:col-span-8">
          <div className="space-y-4">
          {loading ? (
            <div className="text-center text-slate-500 py-8">Loading your sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No sessions yet — create one or join a group.</div>
          ) : (
            sessions.map((s: any) => (
              <Link
                key={s.id}
                href={`/groups/${s.group?.id}/sessions/${s.id}/qna`}
                className="no-underline"
              >
                <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-card/60 p-4 shadow-sm backdrop-blur-sm hover:shadow-md transition md:flex-row md:items-center md:justify-between md:rotate-[0.5deg]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-foreground">{s.name}</span>
                      {s.role && (
                        <span
                          tabIndex={-1}
                          aria-disabled="true"
                          className="inline-flex items-center rounded-full border border-muted-foreground bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground select-none cursor-default pointer-events-none"
                        >
                          {s.role.charAt(0).toUpperCase() + s.role.slice(1)}
                        </span>
                      )}
                    </div>
                    {s.group && (
                      <div className="text-xs text-muted-foreground">
                        Group: {s.group.name}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Created {s.created_at ? new Date(s.created_at).toLocaleString() : "Unknown"}</span>
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 md:ml-4 flex-shrink-0">
                    <span className="text-xs text-primary underline select-none cursor-pointer">Go to Q&amp;A</span>
                  </div>
                </div>
              </Link>
            ))
          )}
          </div>
        </section>
        {/* Floating create action */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-xl text-2xl p-0">+</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {userGroups.length > 0 && (
              <DropdownMenuItem onClick={() => router.push("/sessions/new")}>
                Create session for existing group
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => router.push("/groups/new")}>Create new group</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
