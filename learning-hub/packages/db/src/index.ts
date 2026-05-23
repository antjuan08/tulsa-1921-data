import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    '[ott/db] DATABASE_URL is missing. Add it to apps/web/.env.local (or your shell env).',
  );
}

// `prepare: false` keeps things simple for serverless drivers (Neon HTTP/WS over pgbouncer-like).
// For local Postgres this works identically.
const client = postgres(url, { prepare: false, max: 10 });

export const db = drizzle(client, { schema });

export * from './schema';
export { schema };
