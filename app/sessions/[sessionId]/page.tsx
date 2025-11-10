import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = createClient();

  const sessionResp = await supabase
    .from("sessions")
    .select(`
      *,
      groups (
        name
      ),
      questions (
        *,
        answers (
          *
        )
      ),
      session_members (
        user_id,
        role,
        profiles (
          first_name,
          last_name
        )
      )
    `)
    .eq("id", params.sessionId)
    .single();

  const session = (sessionResp.data ?? null) as any;
  const sessionError = sessionResp.error;

  if (sessionError || !session) {
    notFound();
  }

  // Calculate progress based on questions with answers
  const totalQuestions = (session.questions ?? []).length || 0;
  const answeredQuestions = (((session.questions ?? []) as any[]).filter((q: any) => (q.answers?.length ?? 0) > 0).length) || 0;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <Link href={`/groups/${session.group_id}`} className="text-muted-foreground hover:underline">
            {session.groups?.name}
          </Link>
        </div>
        <Button asChild>
          <Link href={`/sessions/${session.id}/questions/new`}>Ask Question</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressBar value={progress} max={100} />
          <p className="mt-2 text-sm text-muted-foreground">
            {answeredQuestions} of {totalQuestions} questions answered
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Participants Section */}
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {((session.session_members ?? []) as any[]).map((member: any) => (
                <li key={member.user_id} className="flex justify-between items-center">
                  <span>
                    {member.profiles?.first_name} {member.profiles?.last_name}
                  </span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {member.role}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {session.questions && session.questions.length > 0 ? (
              <ul className="space-y-4">
                {((session.questions ?? []) as any[]).map((question: any) => (
                  <li key={question.id} className="border rounded-lg p-4">
                    <div className="font-medium mb-2">{question.content}</div>
                    {question.answers && question.answers.length > 0 ? (
                      <div className="pl-4 border-l-2 mt-2">
                        <p className="text-sm text-muted-foreground">
                          {question.answers[0].content}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No answers yet</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No questions asked yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}