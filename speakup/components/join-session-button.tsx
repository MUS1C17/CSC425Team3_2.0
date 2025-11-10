"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/system/toast";

type JoinSessionButtonProps = {
  sessionId: number;
  qnaHref: string;
  alreadyJoined: boolean;
};

export function JoinSessionButton({ sessionId, qnaHref, alreadyJoined }: JoinSessionButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(alreadyJoined);

  const handleClick = async () => {
    setError(null);

    if (joined) {
      router.push(qnaHref);
      return;
    }

    try {
      setJoining(true);
      const response = await fetch("/api/session-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session_id: sessionId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Failed to join session.");
        return;
      }

      setJoined(true);
      toast({ variant: "success", title: "Joined session" });
      router.push(qnaHref);
    } catch (err) {
      console.error("Unexpected error joining session", err);
      setError("Unexpected error while joining session.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={joining}>
        {joining ? "Joining…" : joined ? "Go to Q&A" : "Join session"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
