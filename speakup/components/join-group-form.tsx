"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type JoinGroupFormProps = {
  initialCode?: string | null;
};

type JoinGroupResponse = {
  message?: string;
  error?: string;
  group?: {
    id: number;
    name: string;
    join_code: string;
  };
};

export default function JoinGroupForm({ initialCode }: JoinGroupFormProps) {
  const router = useRouter();

  const [code, setCode] = useState(initialCode ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError("Enter a join code to continue.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/group-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ join_code: cleaned }),
      });

      const payload = (await response.json()) as JoinGroupResponse;

      if (!response.ok) {
        setError(payload.error ?? "Failed to join group.");
        return;
      }

      const groupId = payload.group?.id;
      if (!groupId) {
        setError("Joined group but could not determine where to go next.");
        return;
      }

      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("Unexpected error joining group", err);
      setError("Unexpected error while joining group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="join-code">Group code</Label>
        <Input
          id="join-code"
          name="join_code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="Enter code (e.g., ABCD1234)"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
        />
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Joining…" : "Join group"}
        </Button>
      </div>
    </form>
  );
}
