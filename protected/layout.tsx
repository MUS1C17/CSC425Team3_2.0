import Link from "next/link";
import { ReactNode } from "react";
import Image from "next/image";
import { createServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/theme-switcher";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
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
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let fullName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("avatar_path, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    avatarUrl = profile?.avatar_path ?? null;
    fullName =
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      "there";
  }

  async function signOutAction(_formData: FormData): Promise<void> {
    "use server";
    const server = createServerClient();
    await server.auth.signOut();
  }

  return (
    <main className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Elegant Top Navigation Bar */}
      <nav className="w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 h-16">
          {/* LEFT — Logo */}
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight hover:opacity-80 transition"
          >
            SpeakUp
          </Link>

          {/* CENTER — Nav Links */}
          <div className="hidden md:flex items-center gap-6 font-medium">
            <Button asChild variant="ghost" className="text-sm font-medium">
              <Link href="/groups">Groups</Link>
            </Button>
            <Button asChild variant="ghost" className="text-sm font-medium">
              <Link href="/sessions">Sessions</Link>
            </Button>
          </div>

          {/* RIGHT — Theme + Profile */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {!hasEnvVars ? <EnvVarWarning /> : null}

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
                    <UserIcon className="w-5 h-5" />
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href="/account">Profile</Link>
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
      </nav>

      {/* Main Page Content */}
      <div className="flex-1 w-full flex flex-col items-center">
        <div className="max-w-6xl w-full px-5 py-10">{children}</div>
      </div>
    </main>
  );
}
