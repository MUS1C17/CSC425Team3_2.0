import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const result = await db.query('SELECT 1 as ok')
    return NextResponse.json({ ok: result.rows[0].ok === 1 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'DB error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

