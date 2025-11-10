"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useToast } from "@/components/system/toast";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({ variant: "success", title: "Signed in" });
      //Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithGoogle = async (e: React.FormEvent) => {
    const supabase = createClient();
    setIsGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:3000/auth/callback",
        },
      });
      if (error) throw error;
      toast({ variant: "success", title: "Redirecting to Google" });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to sign in with Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Welcome back. Enter your details to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              {/* Social first */}
              <Button
                type="button"
                onClick={handleLoginWithGoogle}
                disabled={isGoogleLoading || isLoading}
                className="relative w-full"
                data-cy="continueWithGoogleButton"
              >
                <span className="absolute left-3 inline-flex items-center">
                  <img src="/google-logo.svg" alt="Google" className="h-5 w-5" />
                </span>
                {isGoogleLoading ? "Loading..." : "Continue with Google"}
              </Button>

              <div className="flex items-center my-1">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-2 text-md">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Email/password below */}
              <div className="grid gap-2">
                <Label htmlFor="email" data-cy="emailLabel">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-cy="emailInput"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" data-cy="passwordLabel">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    data-cy="forgotPasswordLink"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-cy="passwordInput"
                />
              </div>
              {error && <p className="text-sm text-red-500" data-cy="errorMessage">{error}</p>}
              <Button type="submit" className="w-full" data-cy="loginButton" disabled={isLoading || isGoogleLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/auth/sign-up" className="underline underline-offset-4" data-cy="signUpLink">
                Create account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
