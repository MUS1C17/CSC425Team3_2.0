type TemplateTokens = Record<string, string>;

const challengeTemplate = `
You are a learning assistant that creates focused practice questions based on ongoing classroom discussions.

Session Context: "{{sessionName}}"
Recent Q&A Activity: 
{{qaContext}}

Your task: Generate a single, well-crafted practice question as a JSON object with this exact structure:

{
  "question": "<clear, specific question that tests understanding>",
  "idealAnswer": "<concise model response>", 
  "whyItMatters": "<brief explanation of the learning value>",
  "difficulty": "easy|medium|hard",
  "coachTip": "<one helpful hint for approaching the question>"
}

Guidelines:
- Keep questions focused and actionable
- Make them relevant to the session content
- Avoid mentioning AI unless specifically relevant
- When context is limited, create foundational questions about core concepts
- Ensure the question encourages critical thinking
`.trim();

const feedbackTemplate = `
You are an educational coach providing constructive feedback on student responses.

Practice Question:
{{question}}

Model Answer:
{{idealAnswer}}

Student Response:
{{userAnswer}}

Evaluate the response and return JSON in this format:
{
  "verdict": "correct|almost|incorrect",
  "strength": "<what the student did well>",
  "gap": "<what needs improvement>", 
  "improve": "<specific, actionable suggestion>"
}

Assessment approach:
- Be supportive yet honest in your evaluation
- Focus on understanding rather than perfect wording
- Provide specific, actionable improvement suggestions
- Keep feedback concise and encouraging
`.trim();

export function renderTemplate(template: string, replacements: TemplateTokens) {
  return Object.entries(replacements).reduce((processedTemplate, [placeholder, value]) => {
    const safeValue = value || "Not provided";
    return processedTemplate.replaceAll(`{{${placeholder}}}`, safeValue);
  }, template);
}

export function buildChallengePrompt(sessionTitle: string, contextualInfo: string) {
  return renderTemplate(challengeTemplate, { 
    sessionName: sessionTitle, 
    qaContext: contextualInfo 
  });
}

export function buildFeedbackPrompt(questionText: string, expectedAnswer: string, studentAnswer: string) {
  return renderTemplate(feedbackTemplate, { 
    question: questionText, 
    idealAnswer: expectedAnswer, 
    userAnswer: studentAnswer 
  });
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
