import { defineConfig } from 'drizzle-kit';

// Prefer a direct (non-pooled) connection for schema introspection / codegen.
const url =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/souramail';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
