import { redirect } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CreateGroupForm from "@/components/create-group-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewGroupPage() {
  const supabase = await createClient();

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claims?.claims) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.first_name ?? "there";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-2">
          <Label htmlFor="group-name" className="text-3xl font-extrabold tracking-tight">
            Let's build your group, {firstName}
          </Label>
          <p className="text-sm text-foreground/80">
            Add the basics so you can invite students with a code or shareable link.
          </p>
        </div>

        <Card className="bg-card/60 border border-white/10 md:rotate-1">
          <CardHeader className="space-y-1">
            <CardTitle>Why groups?</CardTitle>
            <CardDescription>Groups organize sessions for classes, cohorts, and teams.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-2">
              <li>Private or public with shareable links</li>
              <li>Auto-generated join codes</li>
              <li>Central place for your Q&amp;A sessions</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border border-white/10 md:-rotate-1">
          <CardHeader className="space-y-1">
            <CardTitle>Create a new group</CardTitle>
            <CardDescription>
              Set a name, optional description, and privacy level. We'll generate a join code automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateGroupForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

