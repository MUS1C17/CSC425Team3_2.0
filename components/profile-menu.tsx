"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ProfileMenuClient() {
    const { profile, loading, signOut } = useAuth();
    const router = useRouter();

    if (loading) return null;

    const first = (profile?.first_name ?? "").trim();
    const last = (profile?.last_name ?? "").trim();
    const initials = (first?.[0] ?? "").toUpperCase() + (last?.[0] ?? "").toUpperCase();
    const avatarUrl = profile?.avatar_path ?? null;

    async function handleSignOut() {
        await signOut();
        router.push("/auth/login");
    }

    return (
        <details className="relative">
            <summary className="list-none cursor-pointer rounded-full border border-border p-0.5 hover:bg-muted transition flex items-center">
                {avatarUrl ? (
                    <Image src={avatarUrl} alt="Profile" width={32} height={32} className="rounded-full object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-semibold">
                        {initials || "U"}
                    </div>
                )}
            </summary>

            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card shadow-lg overflow-hidden">
                <div className="px-3 py-2 text-xs text-muted-foreground border-b">Signed in</div>

                <div className="p-2 flex flex-col">
                    <Link href="/account" className="px-3 py-2 rounded hover:bg-muted text-sm">
                        Profile
                    </Link>

                    <div className="px-3 py-2">
                        <div className="text-xs mb-1 text-muted-foreground">Appearance</div>
                        <ThemeSwitcher />
                    </div>

                    <button onClick={handleSignOut} className="w-full text-left px-3 py-2 rounded hover:bg-muted text-sm">
                        Logout
                    </button>
                </div>
            </div>
        </details>
    );
}