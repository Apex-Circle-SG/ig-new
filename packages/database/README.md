# Database

PostgreSQL schema, checked-in SQL migrations and controlled publication guards.
The first calculator reads a validated Git snapshot; a database is optional for
that experience. No connection is opened when this package is imported.

From the repository root:

```sh
npm run db:generate
npm run db:migrate
```

`db:migrate` requires `DATABASE_URL` in the process environment or root `.env`.
Use a direct connection for migrations. Review generated SQL before committing.
Never run `drizzle-kit push` against a shared or production database.

See [database operations](../../docs/database.md) and
[security](../../docs/security.md). Private tables are reserved for a later
authenticated release; an `encrypted_payload` column is not an encryption service.
