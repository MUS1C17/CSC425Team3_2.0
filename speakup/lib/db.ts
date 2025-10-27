

import { Pool } from 'pg'

let pool: Pool | null = null

export function getDb() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || ''
    pool = new Pool({ connectionString })
  }
  return pool
}

