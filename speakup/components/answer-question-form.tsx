"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/system/toast";

//component specific type
type AnswerQuestionFormProps = {
  questionId: number;
  sessionId: number;
  groupId: number;
  canAnswer: boolean;
  banMessage?: string | null;
};

export default function AnswerQuestionForm({
  questionId,
  sessionId,
  groupId,
  canAnswer,
  banMessage,
}: AnswerQuestionFormProps) {
  const [answer, setAnswer] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(banMessage ?? null);
  const [open, setOpen] = useState(false);
  const toast = useToast();

  const disabledReason = banMessage ?? "Only session hosts or moderators can answer in this Q&A.";

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!canAnswer) {
      setMessage(disabledReason);
      return;
    }

    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      setMessage("Answer cannot be empty.");
      return;
    }

    setMessage(null);
    setLoading(true);
    let shouldReload = false;

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must be logged in to answer a question.");
        setLoading(false);
        return;
      }

      const uploadedFiles: Array<{
        storage_bucket: string;
        storage_path: string;
        mime_type: string;
        byte_size: number;
        uploaded_by: string;
      }> = [];

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const timestamp = Date.now();
          const safeName = file.name
            .replace(/[^a-zA-Z0-9._()-]/g, "_")
            .replace(/_+/g, "_")
            .slice(0, 200);

          const rawPath = `answers/temp/${user.id}/${timestamp}_${safeName}`;
          const path = rawPath
            .split("/")
            .map((segment) => encodeURIComponent(segment))
            .join("/");

          try {
            const upload = await supabase.storage
              .from("a_attach")
              .upload(path, file, { cacheControl: "3600", upsert: false });

            if (upload.error) {
              console.error("upload error", upload.error);
              setMessage(
                `Uploaded some files but failed for ${file.name}: ${upload.error.message}`,
              );
              continue;
            }

            uploadedFiles.push({
              storage_bucket: "a_attach",
              storage_path: path,
              mime_type: file.type,
              byte_size: file.size,
              uploaded_by: user.id,
            });
          } catch (err) {
            console.error("unexpected upload error", err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setMessage(`Uploaded some files but failed for ${file.name}: ${errorMessage}`);
          }
        }
      }

      const resp = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: trimmedAnswer,
          question_id: questionId,
          session_id: sessionId,
          group_id: groupId,
          attachments: uploadedFiles,
        }),
      });

      const jr = await resp.json();
      if (!resp.ok) {
        setMessage(`Failed to create answer: ${jr.error ?? resp.statusText}`);
        setLoading(false);
        return;
      }

      setMessage("Answer posted successfully.");
      toast({ variant: "success", title: "Answer posted" });
      setAnswer("");
      setFiles(null);
      shouldReload = true;
      setOpen(false);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessage(errorMessage || "Unexpected error while posting answer.");
    } finally {
      setLoading(false);
      if (shouldReload) {
        location.reload();
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          className="text-purple-600 hover:underline px-0"
          disabled={!canAnswer}
        >
          Answer
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 rounded-2xl space-y-4">
        {canAnswer ? (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Share your answer</label>
              <Input
                type="text"
                placeholder="Answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <Input
                type="file"
                multiple
                onChange={(e) => setFiles(e.target.files)}
                className="mt-2"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl px-4 w-auto border-black"
              >
                {loading ? "Posting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAnswer("");
                  setFiles(null);
                  setMessage(null);
                }}
              >
                Clear
              </Button>
            </div>

            {message ? <div className="text-sm text-slate-700">{message}</div> : null}
          </form>
        ) : (
          <p className="text-sm text-slate-600">{disabledReason}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
