// Banco de teste: Postgres em memória (PGlite) com as migrations de supabase/migrations.
// Nada aqui toca no banco de verdade. Só é importado pelos testes.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import type { Db, Exec } from "./sql";

const dir = join(process.cwd(), "supabase", "migrations");

function execOf(pg: PGlite | Transaction): Exec {
  return async <T,>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows;
}

export async function testDb(): Promise<Db & { pg: PGlite }> {
  const pg = await PGlite.create();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await pg.exec(readFileSync(join(dir, file), "utf8"));
  }
  return {
    pg,
    exec: execOf(pg),
    tx: <R,>(fn: (exec: Exec) => Promise<R>) => pg.transaction((tx) => fn(execOf(tx))),
  };
}

/** Atalhos pra montar cenários nos testes. */
export async function seedPuzzles(db: Db, dates: string[]) {
  await db.exec(
    `insert into people (id, display_name, accepted_names, short_bio, years)
     values ('p', 'Pessoa', '{pessoa}', 'bio', '1900') on conflict do nothing`,
  );
  for (const date of dates) {
    await db.exec(
      `insert into daily_puzzles (number, date, person_id)
       values ((select coalesce(max(number), 0) + 1 from daily_puzzles), $1::date, 'p')`,
      [date],
    );
  }
}

export async function addPlayer(db: Db, id: string, name: string | null = null, authUserId: string | null = null) {
  await db.exec(`insert into players (id, name, auth_user_id) values ($1::uuid, $2, $3::uuid)`, [id, name, authUserId]);
}

/** Partida terminada no dia `date` (solvedAt null = errou as 6). `seconds` = tempo de resposta. */
export async function addPlay(
  db: Db,
  playerId: string,
  date: string,
  opts: { solvedAt?: number | null; seconds?: number; finished?: boolean; finishedAt?: string } = {},
) {
  const solvedAt = opts.solvedAt === undefined ? 1 : opts.solvedAt;
  const points = solvedAt ? [100, 80, 60, 40, 20, 5][solvedAt - 1] : 0;
  const finished = opts.finished ?? true;
  const started = opts.finishedAt
    ? new Date(Date.parse(opts.finishedAt) - (opts.seconds ?? 10) * 1000).toISOString()
    : `${date}T15:00:00Z`;
  const finishedAt = finished
    ? (opts.finishedAt ?? new Date(Date.parse(started) + (opts.seconds ?? 10) * 1000).toISOString())
    : null;
  await db.exec(
    `insert into plays (player_id, puzzle_number, solved_at_clue, points, started_at, finished_at, attempts)
     values ($1::uuid, (select number from daily_puzzles where date = $2::date), $3, $4, $5::timestamptz, $6::timestamptz, '[]'::jsonb)`,
    [playerId, date, finished ? solvedAt : null, finished ? points : 0, started, finishedAt],
  );
}
