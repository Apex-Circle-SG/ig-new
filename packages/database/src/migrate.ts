import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabase } from './index';

async function main() {
  const database = createDatabase();
  try {
    await migrate(database.db, {
      migrationsFolder: fileURLToPath(new URL('../migrations/', import.meta.url)),
    });
    console.log('Database migrations applied.');
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  // Driver errors can contain credentials or statement values. Keep CLI output
  // controlled; inspect the database's secured server log for detailed diagnosis.
  const missingConfiguration =
    error instanceof Error && error.message.startsWith('DATABASE_URL is required');
  console.error(
    missingConfiguration
      ? 'DATABASE_URL is required for migrations.'
      : 'Database migration failed. Check connection, permissions and secured database logs.',
  );
  process.exitCode = 1;
});
