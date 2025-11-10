"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/system/toast";

type CreateSessionFormProps = {
  groupId: number;
};

type CreateSessionResponse = {
  message?: string;
  error?: string;
  session?: {
    id: number;
    group_id: number;
  };
};

export default function CreateSessionForm({ groupId }: CreateSessionFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        group_id: groupId, //revert to original, do not force Number()
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        start_time: startTime || null,
        end_time: endTime || null,
      };

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as CreateSessionResponse;

      if (!response.ok) {
        setError(data.error ?? "Failed to create session.");
        return;
      }

      toast({ variant: "success", title: "Session created", description: name ? `“${name}” is ready.` : undefined });
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("Unexpected error creating session", err);
      setError("Unexpected error while creating session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="session-name">Session name</Label>
        <Input
          id="session-name"
          name="name"
          placeholder="Week 3 – Midterm Review"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="session-description">Description (optional)</Label>
        <textarea
          id="session-description"
          name="description"
          placeholder="Give attendees context about this session."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={cn(
            "min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="session-start">Start time (optional)</Label>
          <Input
            id="session-start"
            name="start_time"
            type="datetime-local"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="session-end">End time (optional)</Label>
          <Input
            id="session-end"
            name="end_time"
            type="datetime-local"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create session"}
        </Button>
      </div>
    </form>
  );
}
