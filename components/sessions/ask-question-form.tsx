import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AskQuestionFormProps {
  sessionId: string;
}

export function AskQuestionForm({ sessionId }: AskQuestionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const content = formData.get("content") as string;

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit question");
      }

      const data = await response.json();
      router.refresh();
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask a Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Your Question</Label>
            <Input
              id="content"
              name="content"
              required
              placeholder="What would you like to ask?"
            />
          </div>
          {error && (
            <div className="text-sm font-medium text-red-500">{error}</div>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner className="mr-2" size="sm" /> : null}
            Submit Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}