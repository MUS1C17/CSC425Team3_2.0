"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ThemeSwitcher } from "@/components/theme-switcher";
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

    interface UserProfile {
    avatar_path?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    }

    export default function Navbar({ onSignOut }: { onSignOut?: () => void }) {
    const [user, setUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        async function fetchUser() {
        try {
            const res = await fetch("/api/user");
            if (res.ok) {
            const data = await res.json();
            setUser(data);
            }
        } catch (err) {
            console.error("Failed to fetch user:", err);
        }
        }
        fetchUser();
    }, []);

    const avatarUrl = user?.avatar_path ?? null;
    const fullName =
        user && (user.first_name || user.last_name)
        ? [user.first_name, user.last_name].filter(Boolean).join(" ")
        : "Guest";

    return (
        <nav className="w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 h-16">
            {/* LEFT SECTION */}
            <div className="flex items-center gap-3 sm:gap-4 font-medium">
            <Link href="/" className="text-lg font-semibold">
                SpeakUp
            </Link>

            {/* Page links */}
            <Link href="/groups">
                <button className="h-9 px-3 rounded-md hover:bg-muted transition">Groups</button>
            </Link>
            <Link href="/sessions">
                <button className="h-9 px-3 rounded-md hover:bg-muted transition">Sessions</button>
            </Link>
            </div>

            {/* RIGHT SECTION — profile dropdown */}
            <div className="flex items-center gap-3">
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
                    <Link href="/profile">Profile</Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                    <ThemeSwitcher asChild className="px-2 py-2">
                    Change theme
                    </ThemeSwitcher>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={onSignOut}
                    className="text-red-600 cursor-pointer"
                >
                    Logout
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </div>
        </nav>
    );
}
