import { TutorialStep } from "./tutorial-step";

export function ConnectSupabaseSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Set up your Supabase project">
        <p>
          Go to{" "}
          <a
            href="https://app.supabase.com/project/_/settings/api"
            target="_blank"
            className="font-bold hover:underline text-foreground/80"
            rel="noreferrer"
          >
            database.new
          </a>{" "}
          and create a fresh Supabase project to get started.
        </p>
      </TutorialStep>

      <TutorialStep title="Add your environment variables">
        <p>
          In your Next.js project, rename the{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            .env.example
          </span>{" "}
          file to{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            .env.local
          </span>
          . Then, fill in the required values from{" "}
          <a
            href="https://app.supabase.com/project/_/settings/api"
            target="_blank"
            className="font-bold hover:underline text-foreground/80"
            rel="noreferrer"
          >
            your Supabase project’s API Settings
          </a>
          .
        </p>
      </TutorialStep>

      <TutorialStep title="Restart your development server">
        <p>
          Once your environment variables are set, stop your running Next.js
          server and restart it by running{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            npm run dev
          </span>{" "}
          to ensure the changes take effect.
        </p>
      </TutorialStep>

      <TutorialStep title="Reload your app">
        <p>
          If things don’t update right away, just refresh your browser window so
          Next.js can recognize the new environment settings.
        </p>
      </TutorialStep>
    </ol>
  );
}
