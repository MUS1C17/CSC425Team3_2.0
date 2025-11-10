import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProgressOverview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .select("id")
    .eq("author_id", user.id);
  if (qErr) return null;

  const ids = (questions ?? []).map((q) => q.id);
  let answeredIds = new Set<number>();
  if (ids.length) {
    const { data: answers } = await supabase
      .from("answers")
      .select("question_id")
      .in("question_id", ids);
    (answers ?? []).forEach((a) => a?.question_id && answeredIds.add(a.question_id));
  }

  const total = ids.length;
  const answered = Array.from(answeredIds).length;
  const pct = total ? Math.round((answered / total) * 100) : 0;

  return (
    <Card className="mb-6 bg-card/60 border border-white/10">
      <CardHeader className="py-4">
        <CardTitle className="text-sm">Your Q&amp;A Progress</CardTitle>
        <CardDescription className="text-xs">Answered {answered} of {total}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

