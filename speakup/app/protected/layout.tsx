import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { hasEnvVars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EnvVarWarning } from "@/components/env-var-warning";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon } from "lucide-react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // hard-guard: if this layout wraps protected pages, push to login if unauthenticated
  if (!user) redirect("/auth/login");

  // optional avatar + name
  let avatarUrl: string | null = null;
  let fullName: string | null = null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("avatar_path, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.log("ERROR OCCURRED: " + profileError.message);
  }

  if (profile) {
    avatarUrl = profile.avatar_path ?? null;
    fullName =
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "there";
  }

  // server sign-out
  async function signOutAction(_formData: FormData): Promise<void> {
    "use server";
    const server = await createClient();
    await server.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-6xl h-14 px-4 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="font-semibold tracking-tight">
            SpeakUp
          </Link>

          {/* Right: avatar menu + env banner inline on desktop */}
          <div className="flex items-center gap-3">
            {!hasEnvVars ? <EnvVarWarning /> : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="size-9 rounded-full border border-border hover:bg-muted transition grid place-items-center"
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
                    <UserIcon className="size-5" />
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/account">Profile</Link>
                </DropdownMenuItem>

                {/* Fully clickable Change Theme row */}
                <DropdownMenuItem asChild>
                  {/* ThemeSwitcher already renders a button; asChild makes the whole row clickable */}
                  <ThemeSwitcher asChild className="px-0 py-0">
                    Change theme
                  </ThemeSwitcher>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

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

        {/* Secondary tabs row (super minimal) */}
        <div className="border-t">
          <nav className="mx-auto max-w-6xl h-10 px-4 flex items-center gap-2">
            <Link
              href="/"
              className="text-sm px-2 py-1 rounded hover:bg-muted transition"
            >
              Overview
            </Link>
            <Link
              href="/groups"
              className="text-sm px-2 py-1 rounded hover:bg-muted transition"
            >
              Groups
            </Link>
            <Link
              href="/sessions"
              className="text-sm px-2 py-1 rounded hover:bg-muted transition"
            >
              Sessions
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </div>

      {/* Optional ultra-minimal footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl h-12 px-4 text-xs text-muted-foreground flex items-center">
          © {new Date().getFullYear()} SpeakUp
        </div>
      </footer>
    </main>
  );
}
