"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import supabaseBrowser from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile } from "@/lib/database.types";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      setLoading(true);
  // get typed session from the browser client
  const sessionResp = await supabaseBrowser.auth.getSession();
  const sess = (sessionResp?.data?.session ?? null) as Session | null;
  const usr = sess?.user ?? null;

      if (!mounted) return;
      setSession(sess);
      setUser(usr);

      if (usr) {
        // fetch profile row from `users` or `profiles` table
        const resp = await supabaseBrowser
          .from("users")
          .select("id, first_name, last_name, avatar_path, created_at, updated_at")
          .eq("id", usr.id)
          .maybeSingle();

        const p = (resp.data ?? null) as Profile | null;
        if (mounted) setProfile(p ?? null);
      }

      setLoading(false);
    }

    init();

    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(
      async (event, payload: any) => {
        const newSession = (payload?.session ?? null) as Session | null;
        const newUser = newSession?.user ?? null;
        setSession(newSession);
        setUser(newUser);

        if (newUser) {
          const resp = await supabaseBrowser
            .from("users")
            .select("id, first_name, last_name, avatar_path, created_at, updated_at")
            .eq("id", newUser.id)
            .maybeSingle();

          const p = (resp.data ?? null) as Profile | null;
          setProfile(p ?? null);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const res = await supabaseBrowser.auth.signInWithPassword({ email, password });
    return res;
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    // session/user will be updated by listener
  }

  async function getAccessToken() {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  }

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    signIn,
    signOut,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
