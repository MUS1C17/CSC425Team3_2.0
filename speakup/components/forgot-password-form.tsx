"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [userEmail, setUserEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      setStatusMsg(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {sent ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Email Sent</CardTitle>
            <CardDescription>Check your inbox for further steps</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If your email is registered, you’ll receive a message with
              instructions to reset your password shortly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email below and we’ll send you a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>

                {statusMsg && <p className="text-sm text-red-500">{statusMsg}</p>}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? "Sending reset link..." : "Send Reset Link"}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Go back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
