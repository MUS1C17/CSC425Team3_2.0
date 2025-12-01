type TemplateTokens = Record<string, string>;

const challengeTemplate = `
You are an AI teaching assistant who writes one focused practice question for a live Q&A session.
Session: "{{sessionName}}"
Context from previous questions and answers (keep it concise): 
{{qaContext}}

Produce a JSON object with this shape:
{
  "question": "<one clear question for the learner>",
  "idealAnswer": "<a short, correct answer>",
  "whyItMatters": "<why this question is useful for the learner>",
  "difficulty": "easy|medium|hard",
  "coachTip": "<one actionable tip to think about before answering>"
}

Rules:
- Stay concise and on-topic.
- Do not mention that you are an AI unless explicitly asked.
- If there is little context, generate a fundamental but thoughtful question for the topic.
`.trim();

const feedbackTemplate = `
You are a teaching coach. Check the learner's reply to a practice question.

Question:
{{question}}

Expected/ideal answer:
{{idealAnswer}}

Learner answer:
{{userAnswer}}

Return JSON with:
{
  "verdict": "correct|almost|incorrect",
  "strength": "<what they did well>",
  "gap": "<what is missing or wrong>",
  "improve": "<one practical suggestion to improve the answer>"
}

Be encouraging but direct. Keep responses short.
`.trim();

export function renderTemplate(template: string, tokens: TemplateTokens) {
  return Object.entries(tokens).reduce((acc, [key, value]) => {
    const safeValue = value || "N/A";
    return acc.replaceAll(`{{${key}}}`, safeValue);
  }, template);
}

export function buildChallengePrompt(sessionName: string, qaContext: string) {
  return renderTemplate(challengeTemplate, { sessionName, qaContext });
}

export function buildFeedbackPrompt(question: string, idealAnswer: string, userAnswer: string) {
  return renderTemplate(feedbackTemplate, { question, idealAnswer, userAnswer });
}

export const templates = {
  challengeTemplate,
  feedbackTemplate,
};

export type ChallengePayload = {
  question: string;
  idealAnswer: string;
  whyItMatters: string;
  difficulty: string;
  coachTip: string;
};

export type FeedbackPayload = {
  verdict: "correct" | "almost" | "incorrect";
  strength: string;
  gap: string;
  improve: string;
};
