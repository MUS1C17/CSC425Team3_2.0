"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"div">) {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const onSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    setSubmitting(true);
    setFeedback(null);

    if (userPassword !== confirmPassword) {
      setFeedback("Passwords must match");
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: userEmail,
        password: userPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/protected`,
        },
      });

      if (error) throw error;
      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...rest}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Create Account</CardTitle>
          <CardDescription>Fill in your details to register</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {feedback && (
                <p className="text-sm text-red-500">{feedback}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Sign Up"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="underline underline-offset-4">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
