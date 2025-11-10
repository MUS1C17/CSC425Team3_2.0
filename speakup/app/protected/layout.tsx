import Image from "next/image";
import Link from "next/link";

import { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ProgressOverview from "@/components/progress-overview";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { User as UserIcon } from "lucide-react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  //avatar
  let avatarUrl: string | null = null;
  let fullName: string | null = null;

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("avatar_path, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.log("ERROR OCCURED: " + profileError.message);
    }

    if (profile) {
      avatarUrl = profile.avatar_path ?? null;
      fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "there";
    }
  }

  //sign-out
  async function signOutAction(_formData: FormData): Promise<void> {
    "use server";
    const server = await createClient();
    await server.auth.signOut();
  }

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      <nav className="w-full border-b border-white/10 bg-transparent backdrop-blur-md supports-[backdrop-filter]:bg-background/10 sticky top-0 z-50">
        {/* Outer container */}
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 h-16">
          {/* LEFT SECTION pinned to the very left */}
          <div className="flex items-center gap-3 sm:gap-4 font-medium">
            <Link href="/" className="text-lg font-semibold">
              SpeakUp
            </Link>

            {/* Buttons instead of links */}
            <Button asChild variant="ghost" className="h-9 px-3 rounded-xl">
              <Link href="/groups">Groups</Link>
            </Button>
            <Button asChild variant="ghost" className="h-9 px-3 rounded-xl">
              <Link href="/sessions">Sessions</Link>
            </Button>
          </div>

          {/* RIGHT SECTION — profile dropdown */}
          <div className="flex items-center gap-3">
            {!hasEnvVars ? <EnvVarWarning /> : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* centered circular button */}
                <button
                  className="w-10 h-10 rounded-full border border-white/10 hover:bg-white/10 transition grid place-items-center"
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

                {/* fully clickable Change Theme row */}
                <DropdownMenuItem asChild>
                  <ThemeSwitcher asChild className="px-2 py-2">
                    Change theme
                  </ThemeSwitcher>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Logout action */}
                <DropdownMenuItem asChild>
                  <form action={signOutAction} className="w-full">
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

      {/* PAGE CONTENT */}
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="max-w-6xl w-full px-5 py-10">
          <ProgressOverview />
          {children}
        </div>
      </div>
    </main>
  );
}
