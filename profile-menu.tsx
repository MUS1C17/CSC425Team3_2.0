// Server component avatar dropdown
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ThemeSwitcher } from "@/theme-switcher";

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

export default async function ProfileMenu() {
  const supabase = createServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  // If they’re not logged in, push them to login (protected area should already gate)
  if (userErr || !user) {
    redirect("/auth/login");
  }

  // Try to get profile/initials/avatar from your public.users table
  const { data: profile } = await supabase
    .from("users")
    .select("id, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const first = (profile?.first_name ?? "").trim();
  const last = (profile?.last_name ?? "").trim();
  const initials =
    (first?.[0] ?? "").toUpperCase() + (last?.[0] ?? "").toUpperCase();

  const avatarUrl = (profile as UserRow | null)?.avatar_url ?? null;

  // Simple sign-out action that posts to your auth handler route (adjust if needed)
  async function signOutAction() {
    "use server";
    const serverClient = createServerClient();
    await serverClient.auth.signOut();
    redirect("/auth/login");
  }

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-full border border-border p-0.5 hover:bg-muted transition flex items-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold">
            {initials || "U"}
          </div>
        )}
      </summary>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card shadow-lg overflow-hidden">
        <div className="px-3 py-2 text-xs text-muted-foreground border-b">
          Signed in
        </div>

        <div className="p-2 flex flex-col">
          <Link
            href="/account"
            className="px-3 py-2 rounded hover:bg-muted text-sm"
          >
            Profile
          </Link>

          {/* Theme switcher inline */}
          <div className="px-3 py-2">
            <div className="text-xs mb-1 text-muted-foreground">Appearance</div>
            <ThemeSwitcher />
          </div>

          {/* Logout */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
