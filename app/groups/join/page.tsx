import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import JoinGroupForm from "@/components/join-group-form";
import { createClient } from "@/lib/supabase/server";

type JoinGroupPageProps = {
  searchParams?: Promise<{ code?: string }>;
};

export default async function JoinGroupPage({ searchParams }: JoinGroupPageProps) {
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

  const resolvedSearchParams = (searchParams && (await searchParams)) ?? {};
  const initialCode = resolvedSearchParams.code
    ? resolvedSearchParams.code.toUpperCase()
    : undefined;

  const profileResp = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (profileResp.data ?? null) as any;
  const firstName = profile?.first_name ?? "there";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-2">
          <Label htmlFor="join-code" className="text-2xl font-bold">
            Join a group, {firstName}
          </Label>
          <p className="text-sm text-muted-foreground">
            Enter the invite code you received to access class sessions and Q&amp;A.
          </p>
        </div>

        <Card className="bg-card">
          <CardHeader className="space-y-1">
            <CardTitle>Enter join code</CardTitle>
            <CardDescription>
              The code is 8 characters and is provided by the group owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinGroupForm initialCode={initialCode} />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="ghost" asChild>
            <Link href="/groups/new">Or create your own group</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
