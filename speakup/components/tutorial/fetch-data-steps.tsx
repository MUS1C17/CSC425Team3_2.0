import { TutorialStep } from "./tutorial-step";
import { CodeBlock } from "./code-block";

const create = `create table notes (
  id bigserial primary key,
  title text
);

insert into notes(title)
values
  ('Today I created a Supabase project.'),
  ('I added some data and queried it from Next.js.'),
  ('It was awesome!');
`.trim();

const rls = `alter table notes enable row level security;
create policy "Allow public read access" on notes
for select
using (true);`.trim();

const server = `import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

const client = `'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Page() {
  const [notes, setNotes] = useState<any[] | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchNotes() {
      const { data } = await supabase.from('notes').select()
      setNotes(data)
    }
    fetchNotes()
  }, [])

  return <pre>{JSON.stringify(notes, null, 2)}</pre>
}
`.trim();

export function FetchDataSteps() {
  return (
    <ol className="flex flex-col gap-6">
      <TutorialStep title="Set up tables and seed data">
        <p>
          Open your{" "}
          <a
            href="https://supabase.com/dashboard/project/_/editor"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Table Editor
          </a>{" "}
          to create a new table and add some sample data. You can also paste
          the snippet below into the{" "}
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            SQL Editor
          </a>{" "}
          and hit RUN.
        </p>
        <CodeBlock code={create} />
      </TutorialStep>

      <TutorialStep title="Activate Row Level Security">
        <p>
          Supabase has RLS on by default. To allow queries on your{" "}
          <code>notes</code> table, you need a policy. This can be done either
          in the{" "}
          <a
            href="https://supabase.com/dashboard/project/_/editor"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Table Editor
          </a>{" "}
          or via the{" "}
          <a
            href="https://supabase.com/dashboard/project/_/sql/new"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            SQL Editor
          </a>
          .
        </p>
        <p>For instance, you can run this SQL to make the table publicly readable:</p>
        <CodeBlock code={rls} />
        <p>
          Check out the{" "}
          <a
            href="https://supabase.com/docs/guides/auth/row-level-security"
            className="font-bold hover:underline text-foreground/80"
            target="_blank"
            rel="noreferrer"
          >
            Supabase documentation on RLS
          </a>{" "}
          to learn more.
        </p>
      </TutorialStep>

      <TutorialStep title="Fetch data using Next.js">
        <p>
          To query Supabase from an Async Server Component, create a new
          <code>page.tsx</code> at{" "}
          <span className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs font-medium text-secondary-foreground border">
            /app/notes/page.tsx
          </span>{" "}
          and add the following code:
        </p>
        <CodeBlock code={server} />
        <p>Or, if you prefer a Client Component, use this version:</p>
        <CodeBlock code={client} />
      </TutorialStep>

      <TutorialStep title="Try out the Supabase UI Library">
        <p>
          Visit the{" "}
          <a
            href="https://supabase.com/ui"
            className="font-bold hover:underline text-foreground/80"
          >
            Supabase UI Library
          </a>{" "}
          and experiment with its pre-built components. For example, to add a
          Realtime Chat block, run:
        </p>
        <CodeBlock
          code={
            "npx shadcn@latest add https://supabase.com/ui/r/realtime-chat-nextjs.json"
          }
        />
      </TutorialStep>

      <TutorialStep title="Launch your project!">
        <p>
          Everything’s set up—you can now build, test, and scale your app to
          reach users worldwide. 🚀
        </p>
      </TutorialStep>
    </ol>
  );
}
