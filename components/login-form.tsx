"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { register, handleSubmit, formState } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const { errors } = formState;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use client-side Supabase auth in tests and for direct auth flows
      const client = createClient();
      const { error } = await client.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      } as any);
      if (error) {
        throw new Error(error.message);
      }
      // on success redirect
      router.push("/protected");
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      // Start OAuth flow via Supabase (client-side redirect)
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
        `${location.origin}/protected`
      )}`;
      window.location.assign(url);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div {...props} className={className}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" {...register("email")} />
          <p>{errors.email?.message}</p>
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" {...register("password")} />
          <p>{errors.password?.message}</p>
        </div>

        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <button onClick={handleGoogle} disabled={isLoading}>
        Continue with Google
      </button>
    </div>
  );
}