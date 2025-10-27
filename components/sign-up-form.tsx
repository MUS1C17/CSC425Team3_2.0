"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const signUpSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>)
{
  const { register, handleSubmit, formState } = useForm<SignUpFormData>(
    {
      resolver: zodResolver(signUpSchema),
    }
  );
  const { errors } = formState;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: SignUpFormData) =>
  {
    setIsLoading(true);
    setError(null);
    try {
      const client = createClient();
      const { error } = await client.auth.signUp(
        {
          email: data.email,
          password: data.password,
          options: { data: { first_name: data.first_name, last_name: data.last_name } },
        } as any
      );
      if (error) {
        throw new Error(error.message);
      }
      // On success, direct user to a sign-up success page
      router.push("/auth/sign-up-success");
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div {...props} className={className}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="first_name">First name</label>
          <input id="first_name" {...register("first_name")} />
          <p>{errors.first_name?.message}</p>
        </div>
        <div>
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" {...register("last_name")} />
          <p>{errors.last_name?.message}</p>
        </div>
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
        <div>
          <label htmlFor="confirmPassword">Repeat password</label>
          <input id="confirmPassword" type="password" {...register("confirmPassword")} />
          <p>{errors.confirmPassword?.message}</p>
        </div>

        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}