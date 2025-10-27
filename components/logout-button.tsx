"use client";

import React from "react";
import { useRouter } from "next/navigation";

export function LogoutButton({ children }: { children?: React.ReactNode }) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  };

  return <button onClick={logout}>{children ?? "Logout"}</button>;
}
