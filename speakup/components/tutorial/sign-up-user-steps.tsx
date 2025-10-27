import Link from "next/link";
import { TutorialStep } from "./tutorial-step";
import { ArrowUpRight } from "lucide-react";

export function SignUpUserSteps() {
  return (
    <ol className="flex flex-col gap-6">
      {(process.env.VERCEL_ENV === "preview" ||
        process.env.VERCEL_ENV === "production") && (
        <TutorialStep title="Configure redirect URLs">
          <p>Looks like your app is running on Vercel.</p>
          <p className="mt-4">
            This deployment is
            <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
              &quot;{process.env.VERCEL_ENV}&quot;
            </span>{" "}
            at
            <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
              https://{process.env.VERCEL_URL}
            </span>
            .
          </p>
          <p className="mt-4">
            You’ll need to{" "}
            <Link
              href="https://supabase.com/dashboard/project/_/auth/url-configuration"
              className="text-primary hover:text-foreground"
            >
              update your Supabase project
            </Link>{" "}
            with the correct redirect URLs for this deployment.
          </p>
          <ul className="mt-4">
            <li>
              -{" "}
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                http://localhost:3000/**
              </span>
            </li>
            <li>
              -{" "}
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/**`}
              </span>
            </li>
            <li>
              -{" "}
              <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
                {`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(
                  ".vercel.app",
                  ""
                )}-*-[vercel-team-url].vercel.app/**`}
              </span>{" "}
              (You can find your Vercel Team URL in{" "}
              <Link
                href="https://vercel.com/docs/accounts/create-a-team#find-your-team-id"
                target="_blank"
                className="text-primary hover:text-foreground"
              >
                Team settings
              </Link>
              )
            </li>
          </ul>
          <Link
            href="https://supabase.com/docs/guides/auth/redirect-urls#vercel-preview-urls"
            target="_blank"
            className="text-primary/50 hover:text-primary flex items-center text-sm gap-1 mt-4"
          >
            Supabase Redirect URLs Guide <ArrowUpRight size={14} />
          </Link>
        </TutorialStep>
      )}
      <TutorialStep title="Register your first user">
        <p>
          Navigate to the{" "}
          <Link
            href="auth/sign-up"
            className="font-bold hover:underline text-foreground/80"
          >
            Sign Up
          </Link>{" "}
          page and create your first account. Don’t worry if it’s just you
          initially—your product will attract users soon enough!
        </p>
      </TutorialStep>
    </ol>
  );
}
