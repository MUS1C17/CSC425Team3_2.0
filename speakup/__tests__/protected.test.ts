import React from 'react'
import { renderToString } from 'react-dom/server'

//Shared mutable state for the Supabase mock
const mockState = {
  authed: true,
  userId: 'uid-test-1',
  firstName: 'Testy',
  groups: [{ id: 'g1', name: 'Group One', instructor_name: 'Prof. X', created_at: new Date().toISOString() }],
  sessions: [{ id: 's1', name: 'Session One', group_id: 'g1', start_time: new Date().toISOString(), end_time: null as string | null }],
  questions: [{ id: 'q1', title: 'What is SSR?', is_answered: false, created_at: new Date().toISOString(), session_id: 's1' }],
}

//Mocking the Supabase server client used by the Dashboard page
jest.mock('@/lib/supabase/server', () => {
  const buildClient = () => {
    return {
      auth: {
        getClaims: jest.fn(async () => ({
          data: { claims: mockState.authed ? { sub: mockState.userId } : null },
          error: null,
        })),
        getUser: jest.fn(async () => ({
          data: { user: mockState.authed ? { id: mockState.userId } : null },
          error: null,
        })),
      },
      from: jest.fn((table: string) => {
        //Chain helper for list queries (select -> order -> limit -> Promise)
        const listChain = {
          order: jest.fn(() => ({
            limit: jest.fn(async () => {
              const map: Record<string, any[]> = {
                groups: mockState.groups,
                sessions: mockState.sessions,
                questions: mockState.questions,
              }
              return { data: map[table] ?? [], error: null }
            }),
          })),
        }

        //Chain helper for single row query (users table)
        const singleChain = {
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(async () => ({
              data: table === 'users' ? { first_name: mockState.firstName } : null,
              error: null,
            })),
          })),
        }

        return {
          select: jest.fn(() => ({
            ...listChain,
            ...singleChain,
          })),
        }
      }),
    }
  }

  return {
    createClient: jest.fn(async () => buildClient()),
  }
})

//Mock next/navigation redirect to throw, so we can assert redirects
jest.mock('next/navigation', () => {
  return {
    //Only mock what we use
    redirect: (path: string) => {
      const err = new Error(`REDIRECT:${path}`)
      //Tag the error for identification
      ;(err as any).isRedirect = true
      throw err
    },
  }
})

//lucide-react is ESM and not needed for behavioral tests; mock to simple stubs
jest.mock('lucide-react', () => {
  const React = require('react')
  const Stub = (props: any) => React.createElement('span', { ...props })
  return {
    InfoIcon: Stub,
    UsersIcon: Stub,
    CalendarDaysIcon: Stub,
    MessageSquareIcon: Stub,
    ChevronRight: Stub,
  }
})

jest.mock('next/link', () => {
  const React = require('react')
  return ({ href, children, ...rest }: any) => React.createElement('a', { href, ...rest }, children)
})

describe('Protected Dashboard page', () => {
  test('redirects unauthenticated users to /auth/login', async () => {
    mockState.authed = false

    const { default: Dashboard } = await import('@/app/protected/page')

    await expect(Dashboard()).rejects.toThrow(/REDIRECT:\/auth\/login/)
  })

  test('renders for authenticated users and greets by first name', async () => {
    mockState.authed = true
    mockState.firstName = 'Jordan'

    const { default: Dashboard } = await import('@/app/protected/page')
    const element = await Dashboard()
    const html = renderToString(element as any)

    //Allow for markup/comment separators in rendered output
    expect(html).toContain('Jordan')
  })
})
