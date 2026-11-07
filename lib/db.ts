import "server-only";
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

const globalForDb = globalThis as unknown as { whodySql?: Sql };

function create(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não definida");
  // prepare: false porque o pooler do Supabase em modo transaction não aceita prepared statements.
  const max = Number(process.env.DATABASE_POOL_MAX) || 5;
  return postgres(url, { prepare: false, max, idle_timeout: 20, onnotice: () => {} });
}

export function db(): Sql {
  globalForDb.whodySql ??= create();
  return globalForDb.whodySql;
}
