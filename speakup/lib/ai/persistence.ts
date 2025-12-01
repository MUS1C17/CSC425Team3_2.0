import { getDb } from "../db";

export type AiSubmissionRow = {
  submission_id: string;
  session_id: number | null;
  user_id: string | null;
  prompt: string;
  response: string;
  user_answer: string | null;
  ai_feedback: string | null;
  created_at: string;
  model: string | null;
  prompt_template: string | null;
};

async function ensureAiTable() {
  const db = getDb();
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_submissions (
      submission_id TEXT PRIMARY KEY,
      session_id BIGINT,
      user_id TEXT,
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      user_answer TEXT,
      ai_feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      model TEXT,
      prompt_template TEXT
    );
  `);
  return db;
}

export async function logAiPrompt(params: {
  submissionId: string;
  sessionId: number | null;
  userId: string | null;
  prompt: string;
  response: string;
  model?: string;
  promptTemplate?: string;
}) {
  const db = await ensureAiTable();
  await db.query(
    `
    INSERT INTO ai_submissions (submission_id, session_id, user_id, prompt, response, model, prompt_template)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      params.submissionId,
      params.sessionId,
      params.userId,
      params.prompt,
      params.response,
      params.model ?? null,
      params.promptTemplate ?? null,
    ],
  );
}

export async function logAiFeedback(params: {
  submissionId: string;
  userAnswer: string;
  aiFeedback: string;
}) {
  const db = await ensureAiTable();
  await db.query(
    `
    UPDATE ai_submissions
    SET user_answer = $2, ai_feedback = $3
    WHERE submission_id = $1
    `,
    [params.submissionId, params.userAnswer, params.aiFeedback],
  );
}

export async function listAiSubmissions(sessionId: number, userId?: string | null) {
  try {
    const db = await ensureAiTable();
    const values: Array<number | string> = [sessionId];
    const userClause = userId ? "AND (user_id = $2 OR user_id IS NULL)" : "";
    if (userId) values.push(userId);

    const result = await db.query<AiSubmissionRow>(
      `
      SELECT submission_id, session_id, user_id, prompt, response, user_answer, ai_feedback, created_at, model, prompt_template
      FROM ai_submissions
      WHERE session_id = $1
      ${userClause}
      ORDER BY created_at DESC
      LIMIT 20
      `,
      values,
    );
    return result.rows;
  } catch {
    return [];
  }
}

export async function getSubmission(submissionId: string) {
  try {
    const db = await ensureAiTable();
    const result = await db.query<AiSubmissionRow>(
      `
      SELECT submission_id, session_id, user_id, prompt, response, user_answer, ai_feedback, created_at, model, prompt_template
      FROM ai_submissions
      WHERE submission_id = $1
      LIMIT 1
      `,
      [submissionId],
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}
