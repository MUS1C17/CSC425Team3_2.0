"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";

interface User {
    first_name: string;
    last_name: string;
    email: string;
    id: string;
    avatar_path?: string;
    }

    export default function Profile() {
    const [isNotEditable, setIsNotEditable] = useState(true);
    const [error, setError] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [fiNameChange, setFirstName] = useState("");
    const [laNameChange, setLastName] = useState("");
    const [emailChange, setEmail] = useState("");
    const [avatarPathChange, setAvatarPath] = useState("");

    // Fetch user on mount
    useEffect(() => {
        async function fetchUser() {
        const res = await fetch("/api/user");
        if (!res.ok) {
            setError(`Failed to load user: ${res.status}`);
            return;
        }
        const data = await res.json();
        setUser(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setEmail(data.email);
        setAvatarPath(data.avatar_path || "");
        }
        fetchUser();
    }, []);

    // PATCH update
    const updateUser = async () => {
        if (!user) return;

        try {
        const res = await fetch("/api/user", {
            method: "PATCH", // <-- use PATCH
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            first_name: fiNameChange,
            last_name: laNameChange,
            email: emailChange,
            avatar_path: avatarPathChange,
            }),
        });

        if (!res.ok) {
            let errMessage = "Failed to update user";
            try {
            const err = await res.json();
            errMessage = err?.error || errMessage;
            } catch {}
            setError(errMessage);
            return;
        }

        const data = await res.json();
        setUser(data);
        setIsNotEditable(true);
        } catch (err) {
        console.error(err);
        setError("Failed to update user");
        }
    };

    const userDetail = `text-foreground text-lg font-mono p-3 rounded-md border transition-colors
        ${!isNotEditable
        ? "bg-card border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        : "bg-muted border-border text-muted-foreground cursor-default"
        }`;

    const specifierClassName = "text-lg font-mono text-muted-foreground";

    return (
        <div className="flex-1 w-full flex flex-col gap-12">
        <Navbar />
        <div className="flex justify-center items-center mt-20">
            <div className="flex flex-col gap-6 w-96">
            <h2 className="font-bold text-2xl mb-4">Your user details</h2>

            <h3 className={specifierClassName}>First name:</h3>
            <input
                type="text"
                value={isNotEditable ? user?.first_name || "" : fiNameChange}
                readOnly={isNotEditable}
                onChange={(e) => setFirstName(e.target.value)}
                className={userDetail}
            />

            <h3 className={specifierClassName}>Last Name:</h3>
            <input
                type="text"
                value={isNotEditable ? user?.last_name || "" : laNameChange}
                readOnly={isNotEditable}
                onChange={(e) => setLastName(e.target.value)}
                className={userDetail}
            />

            <h3 className={specifierClassName}>Email:</h3>
            <input
                type="text"
                value={isNotEditable ? user?.email || "" : emailChange}
                readOnly={isNotEditable}
                onChange={(e) => setEmail(e.target.value)}
                className={userDetail}
            />

            <div className="flex gap-4 mt-4">
                <Button
                onClick={() => setIsNotEditable(false)}
                disabled={!isNotEditable}
                variant="default"
                >
                Edit Changes
                </Button>

                <Button
                onClick={() => updateUser()}
                disabled={isNotEditable}
                variant="secondary"
                >
                Save Changes
                </Button>

                <Button
                onClick={() => {
                    if (user) {
                    setFirstName(user.first_name);
                    setLastName(user.last_name);
                    setEmail(user.email);
                    setAvatarPath(user.avatar_path || "");
                    }
                    setIsNotEditable(true);
                }}
                disabled={isNotEditable}
                variant="secondary"
                >
                Discard Changes
                </Button>
            </div>

            {error && <p className="text-red-600 mt-2">{error}</p>}
            </div>
        </div>
        </div>
    );
}
