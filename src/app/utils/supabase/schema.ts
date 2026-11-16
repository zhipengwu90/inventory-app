// Which Postgres schema the app reads and writes. Production uses `public`;
// `npm run dev` sets NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev (.env.development) so
// local testing works on a copy (rebuild it with supabase/refresh_dev_schema.sql).
// Typed as "public" because the client is untyped and only knows that name.
export const dbSchema = (process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA ||
  "public") as "public";
