import "server-only";
import { db } from "./db";
import type { Db, Exec } from "./sql";

type Unsafe = { unsafe: (text: string, params?: never[]) => Promise<unknown> };

function execOf(q: Unsafe): Exec {
  return async <T,>(text: string, params: unknown[] = []) => (await q.unsafe(text, params as never[])) as T[];
}

/** O banco do app (DATABASE_URL) na interface `Db`. */
export function appDb(): Db {
  const sql = db();
  return {
    exec: execOf(sql),
    tx: <R,>(fn: (exec: Exec) => Promise<R>) => sql.begin((tx) => fn(execOf(tx))) as Promise<R>,
  };
}
