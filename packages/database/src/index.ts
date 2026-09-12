import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';
export { publishIncomeDistribution } from './publish';

/** Server/batch only. Never instantiate a connection during module import. */
export function createDatabase(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required for database operations.');
  const connection = postgres(databaseUrl, {
    max: 5,
    connect_timeout: 10,
    idle_timeout: 20,
    prepare: false,
  });
  return {
    db: drizzle(connection, { schema }),
    close: () => connection.end({ timeout: 5 }),
  };
}

export type Database = ReturnType<typeof createDatabase>['db'];
