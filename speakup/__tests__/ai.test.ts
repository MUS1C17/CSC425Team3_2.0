import request from 'supertest'
import { createTestServer } from './utils/testServer'

const store: any[] = []

jest.mock('@/lib/ai/model', () => ({
  generateModelText: jest.fn(async (_prompt: string, fallback: string) => {
    //Return deterministic JSON so snapshots are stable
    return (
      fallback ||
      JSON.stringify({
        question: 'Mock question',
        idealAnswer: 'Mock answer',
        whyItMatters: 'Because testing matters',
        difficulty: 'easy',
        coachTip: 'Stay concise',
      })
    )
  }),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
    },
  })),
}))

function makeBuilder(table: string, dataByTable: Record<string, any[]>) {
  const promise = Promise.resolve({ data: dataByTable[table] ?? [], error: null })
  const builder: any = {
    eq: () => builder,
    in: () => builder,
    is: () => builder,
    order: () => ({
      limit: () => promise,
    }),
    maybeSingle: () =>
      Promise.resolve({ data: (dataByTable[table] ?? [])[0] ?? null, error: null }),
    select: () => builder,
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  }
  return builder
}

jest.mock('@/lib/supabase/service', () => {
  const dataByTable: Record<string, any[]> = {
    sessions: [{ id: 1, group_id: 1, deleted_at: null, name: 'AI Session' }],
    session_members: [{ role: 'host' }],
    group_members: [{ role: 'owner' }],
    session_bans: [],
    group_bans: [],
    questions: [
      {
        id: 10,
        title: 'What is SSR?',
        description: 'Explain server side rendering',
        created_at: new Date().toISOString(),
      },
    ],
    answers: [
      {
        id: 20,
        question_id: 10,
        answer: 'Rendering on the server before sending HTML',
        created_at: new Date().toISOString(),
      },
    ],
  }

  return {
    createServiceClient: jest.fn(() => ({
      from: (table: string) => ({
        select: () => makeBuilder(table, dataByTable),
      }),
    })),
  }
})

jest.mock('@/lib/ai/persistence', () => ({
  logAiPrompt: jest.fn(async ({ submissionId, prompt, response }) => {
    store.push({ submission_id: submissionId, prompt, response })
  }),
  logAiFeedback: jest.fn(async ({ submissionId, userAnswer, aiFeedback }) => {
    const row = store.find((r) => r.submission_id === submissionId)
    if (row) {
      row.user_answer = userAnswer
      row.ai_feedback = aiFeedback
    }
  }),
  listAiSubmissions: jest.fn(async () => store),
  getSubmission: jest.fn(async (submissionId: string) => {
    return store.find((r) => r.submission_id === submissionId) ?? null
  }),
}))

const server = createTestServer()

beforeAll(() => new Promise<void>((resolve) => server.listen(() => resolve())))
afterAll(() =>
  new Promise<void>((resolve, reject) =>
    server.close((err?: Error) => (err ? reject(err) : resolve())),
  ),
)

describe('AI routes', () => {
  test('generateChallenge returns challenge and logs prompt/response', async () => {
    const res = await request(server)
      .post('/ai/generateChallenge')
      .send({ session_id: 1 })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body.submissionId).toBeTruthy()
    expect(res.body.challenge.question).toBeTruthy()
    expect(res.body).toMatchSnapshot({
      submissionId: expect.any(String),
      challenge: expect.any(Object),
      promptTemplate: expect.any(String),
    })
  })

  test('submitForFeedback stores user answer and returns feedback', async () => {
    const challengeRes = await request(server)
      .post('/ai/generateChallenge')
      .send({ session_id: 1 })
      .set('Content-Type', 'application/json')

    const submissionId = challengeRes.body.submissionId

    const feedbackRes = await request(server)
      .post('/ai/submitForFeedback')
      .send({ submission_id: submissionId, user_answer: 'My attempt' })
      .set('Content-Type', 'application/json')

    expect(feedbackRes.status).toBe(200)
    expect(feedbackRes.body.feedback).toBeTruthy()
    expect(feedbackRes.body.feedback.verdict).toBeDefined()
  })
})
