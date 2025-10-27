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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"div">) {
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const supabase = createClient();
    setSubmitting(true);
    setFeedback(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      router.push("/protected");
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
          <CardTitle className="text-2xl font-semibold">
            Update Password
          </CardTitle>
          <CardDescription>
            Enter your new password below to finish resetting your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              {feedback && <p className="text-sm text-red-500">{feedback}</p>}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Updating..." : "Confirm Password Change"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
