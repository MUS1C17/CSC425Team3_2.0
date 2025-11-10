"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CreateSessionForm from "@/components/create-session-form";
import Link from "next/link";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";

export default function SessionsPage() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    async function fetchAvatarAndGroups() {
      const supabase = createClient();
      // Fetch avatar and name
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const profileResp = await supabase
        .from("users")
        .select("avatar_path, first_name, last_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      const profile = (profileResp.data ?? null) as any;
      setAvatarUrl(profile?.avatar_path ?? null);
      setFullName(
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "there"
      );
      // Fetch groups
      const groupResp = await supabase
        .from("groups")
        .select("id, name, created_at")
        .order("created_at", { ascending: false });
      const groupData = (groupResp.data ?? []) as any[];
      if (groupData && groupData.length > 0) {
        setGroups(groupData);
        setSelectedGroupId(String(groupData[0].id)); // Preselect newest group
      }
      setLoadingGroups(false);
    }
    fetchAvatarAndGroups();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <nav className="w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 h-16">
          <div className="flex items-center gap-3 sm:gap-4 font-medium">
            <Link href="/protected" className="text-lg font-semibold">
              SpeakUp
            </Link>
            <Link href="/groups" className="h-9 px-3 flex items-center rounded-md hover:bg-muted text-muted-foreground font-medium transition">Groups</Link>
            <Link href="/sessions" className="h-9 px-3 flex items-center rounded-md bg-muted text-foreground font-semibold transition">Sessions</Link>
          </div>
          <div className="flex items-center gap-3">
            {!hasEnvVars ? <div className="text-xs text-red-500">Missing env vars</div> : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 rounded-full border border-border hover:bg-muted transition grid place-items-center"
                  aria-label="Open profile menu"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ThemeSwitcher asChild className="px-2 py-2">
                    Change theme
                  </ThemeSwitcher>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action="/auth/logout" method="post" className="w-full">
                    <button type="submit" className="w-full text-left">
                      Logout
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
      <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold text-foreground">Create a Session</h1>
              <p className="text-sm text-muted-foreground">
                Use the form below to create a new session. Sessions are where questions and answers live. You can create sessions for lectures, office hours, or recurring classes.
              </p>
            </div>
          </div>
          <Card className="bg-card border border-border">
            <CardHeader className="space-y-1">
              <CardTitle className="text-foreground">New Session</CardTitle>
              <CardDescription className="text-muted-foreground">
                Fill in the details for your new session. Optionally set start and end times to help students know when to join live.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="text-center py-8 text-muted-foreground">Loading groups...</div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="text-muted-foreground">You have no groups yet.</div>
                  <Link href="/groups/new" className="underline text-primary">Create a Group</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <label htmlFor="group-select" className="font-medium text-sm">Select a group</label>
                  <select
                    id="group-select"
                    className="border rounded-md px-3 py-2 focus:outline-none focus:ring focus:border-primary bg-background"
                    value={selectedGroupId ?? ''}
                    onChange={e => setSelectedGroupId(String(e.target.value))}
                  >
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  {selectedGroupId && (
                    <CreateSessionForm groupId={Number(selectedGroupId)} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
