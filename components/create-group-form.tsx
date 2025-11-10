"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CreateGroupResponse = {
  message?: string;
  error?: string;
  group?: {
    id: number;
    name: string;
    description: string | null;
    is_private: boolean;
    join_code?: string | null;
    join_link?: string | null;
  };
};

export default function CreateGroupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        is_private: isPrivate,
      };

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as CreateGroupResponse;

      if (!response.ok) {
        setError(data.error ?? "Failed to create group.");
        return;
      }

      const groupId = data.group?.id;
      if (!groupId) {
        setError("Group created but response was missing the group ID.");
        return;
      }

      const joinCode =
        data.group?.join_code ?? (data.group as unknown as { joinCode?: string })?.joinCode ?? null;
      const joinLink =
        data.group?.join_link ?? (data.group as unknown as { joinLink?: string })?.joinLink ?? null;

      const searchParams = new URLSearchParams();
      searchParams.set("groupCreated", "1");
      if (joinCode) searchParams.set("joinCode", joinCode);
      if (joinLink) searchParams.set("joinLink", joinLink);

      router.push(`/groups/${groupId}/sessions/new?${searchParams.toString()}`);
    } catch (err) {
      console.error("Unexpected error creating group", err);
      setError("Unexpected error while creating group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="group-name">Group name</Label>
        <Input
          id="group-name"
          name="name"
          placeholder="Intro to Sociology"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          data-cy="groupNameInput"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-description">Description (optional)</Label>
        <textarea
          data-cy="descriptionTextArea"
          id="group-description"
          name="description"
          placeholder="Add a note students will see when they join."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={cn(
            "min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          data-cy="privateGroupCheckbox"
          id="group-private"
          checked={isPrivate}
          onCheckedChange={(value) => {
            setIsPrivate(value === true);
          }}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="group-private">Private group</Label>
          <p className="text-sm text-muted-foreground">
            Only people with the join code or link can access the group.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} data-cy="createGroupButton">
          {submitting ? "Creating…" : "Create group"}
        </Button>
      </div>
    </form>
  );
}
