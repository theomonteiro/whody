// Liga o jogador anônimo do cookie a uma conta (Supabase Auth). Sem "server-only": testado no PGlite.
//
// - Conta nova: o próprio jogador anônimo vira o jogador da conta (mesmo id, mesmo histórico).
// - Conta que já existe (outro aparelho): as partidas do anônimo passam pra conta. Se os dois jogaram
//   o mesmo dia, fica a partida que terminou primeiro (`keepAnonymousPlay`). A que perdeu continua no
//   jogador anônimo, marcado com merged_into: nada é apagado.

import { isUniqueViolation, type Db, type Exec } from "../sql";

export type PlayForMerge = { finishedAt: string | null };

/**
 * true = fica a partida do anônimo; false = fica a da conta.
 * Terminada ganha de não terminada; entre duas terminadas, a que terminou antes; senão, a da conta.
 */
export function keepAnonymousPlay(anonymous: PlayForMerge, account: PlayForMerge): boolean {
  if (anonymous.finishedAt === null) return false;
  if (account.finishedAt === null) return true;
  return Date.parse(anonymous.finishedAt) < Date.parse(account.finishedAt);
}

type PlayerRow = { id: string; auth_user_id: string | null; merged_into: string | null };

type FullPlay = {
  puzzle_number: number;
  attempts: string;
  solved_at_clue: number | null;
  points: number;
  started_at: string;
  finished_at: string | null;
};

const PLAY_COLUMNS = `puzzle_number, attempts::text as attempts, solved_at_clue, points,
  to_char(started_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as started_at,
  to_char(finished_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as finished_at`;

async function mergePlays(exec: Exec, anonId: string, accountId: string) {
  // Dias que só o anônimo jogou: passam inteiros pra conta.
  await exec(
    `update plays set player_id = $2::uuid
     where player_id = $1::uuid
       and puzzle_number not in (select puzzle_number from plays where player_id = $2::uuid)`,
    [anonId, accountId],
  );

  // Dias que os dois jogaram: troca o conteúdo quando a do anônimo terminou primeiro.
  const anonPlays = await exec<FullPlay>(`select ${PLAY_COLUMNS} from plays where player_id = $1::uuid for update`, [anonId]);
  if (anonPlays.length === 0) return;
  const accountPlays = await exec<FullPlay>(
    `select ${PLAY_COLUMNS} from plays where player_id = $1::uuid and puzzle_number = any($2::int[]) for update`,
    [accountId, anonPlays.map((p) => p.puzzle_number)],
  );
  const byNumber = new Map(accountPlays.map((p) => [p.puzzle_number, p]));
  for (const anon of anonPlays) {
    const account = byNumber.get(anon.puzzle_number);
    if (!account) continue;
    if (!keepAnonymousPlay({ finishedAt: anon.finished_at }, { finishedAt: account.finished_at })) continue;
    await writePlay(exec, accountId, anon);
    await writePlay(exec, anonId, account);
  }
}

async function writePlay(exec: Exec, playerId: string, p: FullPlay) {
  await exec(
    `update plays set attempts = $3::jsonb, solved_at_clue = $4, points = $5,
       started_at = $6::timestamptz, finished_at = $7::timestamptz
     where player_id = $1::uuid and puzzle_number = $2`,
    [playerId, p.puzzle_number, p.attempts, p.solved_at_clue, p.points, p.started_at, p.finished_at],
  );
}

async function linkOnce(db: Db, anonId: string | null, authUserId: string): Promise<string> {
  return db.tx(async (exec) => {
    const [account] = await exec<{ id: string }>(
      `select id::text as id from players where auth_user_id = $1::uuid for update`,
      [authUserId],
    );
    const [anon] = anonId
      ? await exec<PlayerRow>(
          `select id, auth_user_id::text, merged_into::text from players where id = $1::uuid for update`,
          [anonId],
        )
      : [];
    const anonFree = !!anon && anon.auth_user_id === null && anon.merged_into === null;

    if (!account) {
      if (anonFree) {
        await exec(`update players set auth_user_id = $2::uuid where id = $1::uuid`, [anon.id, authUserId]);
        return anon.id;
      }
      if (anonId && !anon) {
        // Cookie que ainda não jogou nada: vira o jogador da conta.
        await exec(`insert into players (id, auth_user_id) values ($1::uuid, $2::uuid)`, [anonId, authUserId]);
        return anonId;
      }
      const [created] = await exec<{ id: string }>(
        `insert into players (id, auth_user_id) values (gen_random_uuid(), $1::uuid) returning id::text`,
        [authUserId],
      );
      return created.id;
    }

    if (anonFree && anon.id !== account.id) {
      await mergePlays(exec, anon.id, account.id);
      await exec(`update players set merged_into = $2::uuid, merged_at = now() where id = $1::uuid`, [anon.id, account.id]);
    }
    return account.id;
  });
}

/** Devolve o id do jogador da conta, criando ou juntando o anônimo. Idempotente. */
export async function linkAccount(db: Db, anonId: string | null, authUserId: string): Promise<string> {
  try {
    return await linkOnce(db, anonId, authUserId);
  } catch (err) {
    // Dois logins ao mesmo tempo (duas abas): o segundo encontra a conta criada pelo primeiro.
    if (isUniqueViolation(err)) return linkOnce(db, anonId, authUserId);
    throw err;
  }
}

/** Jogador da conta (ou null se a conta ainda não foi ligada). */
export async function accountPlayer(
  exec: Exec,
  authUserId: string,
): Promise<{ id: string; name: string | null } | null> {
  const [row] = await exec<{ id: string; name: string | null }>(
    `select id::text, name from players where auth_user_id = $1::uuid`,
    [authUserId],
  );
  return row ?? null;
}

/** Um cookie só joga como anônimo se o jogador dele não pertence a uma conta. */
export async function anonymousUsable(exec: Exec, playerId: string): Promise<boolean> {
  const [row] = await exec<{ taken: boolean }>(
    `select (auth_user_id is not null or merged_into is not null) as taken from players where id = $1::uuid`,
    [playerId],
  );
  return !row?.taken;
}

export async function setPlayerName(exec: Exec, playerId: string, name: string) {
  await exec(`update players set name = $2 where id = $1::uuid`, [playerId, name]);
}
