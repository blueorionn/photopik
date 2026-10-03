import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set — add the Supabase session pooler URL to .env'
  )
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  // Session pooler URL — used for migrations (DDL).
  // The runtime app connects via the transaction pooler instead.
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
