import request from 'supertest'
import { createTestServer } from './utils/testServer'

//Mock the Supabase server client used by route handlers
jest.mock('@/lib/supabase/server', () => {
  return {
    createClient: jest.fn(async () => {
      return {
        auth: {
          signInWithPassword: jest.fn(async ({ email, password }) => {
            if (email === 'user@example.com' && password === 'correct') {
              return { data: { user: { id: 'uid123', email } }, error: null }
            }
            return { data: { user: null }, error: { message: 'Invalid login credentials' } }
          }),
          signUp: jest.fn(async ({ email, password }) => {
            if (!email || !password) {
              return { data: { user: null }, error: { message: 'Missing fields' } }
            }
            if (email === 'exists@example.com') {
              return { data: { user: null }, error: { message: 'User already registered' } }
            }
            return { data: { user: { id: 'uid999', email } }, error: null }
          }),
          signOut: jest.fn(async () => ({ data: {}, error: null })),
          getClaims: jest.fn(async () => ({ data: { claims: { email: 'user@example.com' } } })),
        },
      }
    }),
  }
})

describe('Auth API', () => {
  const server = createTestServer()

  beforeAll(() => new Promise<void>((resolve) => server.listen(() => resolve())))
  afterAll(() =>
    new Promise<void>((resolve, reject) =>
      server.close((err?: Error) => (err ? reject(err) : resolve())),
    ),
  )

  test('signup success', async () => {
    const res = await request(server)
      .post('/api/auth/signup')
      .send({ email: 'new@example.com', password: 'secret' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body.user).toEqual({ id: 'uid999', email: 'new@example.com' })
  })

  test('signup duplicate user returns 400', async () => {
    const res = await request(server)
      .post('/api/auth/signup')
      .send({ email: 'exists@example.com', password: 'secret' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/already/i)
  })

  test('login success', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'correct' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(200)
    expect(res.body.user).toEqual({ id: 'uid123', email: 'user@example.com' })
  })

  test('login invalid credentials returns 401', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'wrong' })
      .set('Content-Type', 'application/json')

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid/i)
  })

  test('logout success', async () => {
    const res = await request(server).post('/api/auth/logout')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
