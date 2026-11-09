// Ligação do jogador anônimo à conta, contra um Postgres em memória (PGlite).
import { beforeEach, describe, expect, it } from "vitest";
import { addPlay, addPlayer, seedPuzzles, testDb } from "../test-db";
import type { Db } from "../sql";
import { anonymousUsable, keepAnonymousPlay, linkAccount } from "./link";

const ANON = "00000000-0000-4000-8000-0000000000a1";
const ANON2 = "00000000-0000-4000-8000-0000000000a2";
const USER = "10000000-0000-4000-8000-000000000001";

let db: Db;

async function plays(playerId: string) {
  return db.exec<{ date: string; solved: number | null; points: number }>(
    `select d.date::text as date, p.solved_at_clue as solved, p.points
     from plays p join daily_puzzles d on d.number = p.puzzle_number
     where p.player_id = $1::uuid order by d.date`,
    [playerId],
  );
}

beforeEach(async () => {
  db = await testDb();
  await seedPuzzles(db, ["2026-11-07", "2026-11-08", "2026-11-09", "2026-11-10"]);
}, 30_000);

describe("keepAnonymousPlay", () => {
  it("terminada ganha de não terminada; entre terminadas, a que terminou primeiro; senão a da conta", () => {
    expect(keepAnonymousPlay({ finishedAt: "2026-11-09T10:00:00Z" }, { finishedAt: null })).toBe(true);
    expect(keepAnonymousPlay({ finishedAt: null }, { finishedAt: "2026-11-09T10:00:00Z" })).toBe(false);
    expect(keepAnonymousPlay({ finishedAt: "2026-11-09T09:00:00Z" }, { finishedAt: "2026-11-09T10:00:00Z" })).toBe(true);
    expect(keepAnonymousPlay({ finishedAt: "2026-11-09T11:00:00Z" }, { finishedAt: "2026-11-09T10:00:00Z" })).toBe(false);
    expect(keepAnonymousPlay({ finishedAt: null }, { finishedAt: null })).toBe(false);
  });
});

describe("linkAccount", () => {
  it("primeiro login: o anônimo vira a conta, com tudo que jogou", async () => {
    await addPlayer(db, ANON);
    await addPlay(db, ANON, "2026-11-08", { solvedAt: 2 });
    expect(await linkAccount(db, ANON, USER)).toBe(ANON);
    expect(await linkAccount(db, ANON, USER)).toBe(ANON); // idempotente
    expect((await plays(ANON)).length).toBe(1);
    expect(await anonymousUsable(db.exec, ANON)).toBe(false); // deslogado, o cookie não joga mais por ele
  });

  it("cookie que ainda não jogou vira a conta; sem cookie, cria um jogador novo", async () => {
    expect(await linkAccount(db, ANON, USER)).toBe(ANON);
    const other = await linkAccount(db, null, "10000000-0000-4000-8000-000000000002");
    expect(other).not.toBe(ANON);
  });

  it("outro aparelho: as partidas passam pra conta e, no mesmo dia, fica a que terminou primeiro", async () => {
    await addPlayer(db, ANON);
    await linkAccount(db, ANON, USER); // conta = ANON
    await addPlay(db, ANON, "2026-11-08", { solvedAt: 5, finishedAt: "2026-11-08T20:00:00Z" });
    await addPlay(db, ANON, "2026-11-09", { solvedAt: 3, finishedAt: "2026-11-09T12:00:00Z" });

    await addPlayer(db, ANON2);
    await addPlay(db, ANON2, "2026-11-07", { solvedAt: 1 }); // só no aparelho novo
    await addPlay(db, ANON2, "2026-11-08", { solvedAt: 1, finishedAt: "2026-11-08T10:00:00Z" }); // terminou antes
    await addPlay(db, ANON2, "2026-11-09", { solvedAt: 1, finishedAt: "2026-11-09T18:00:00Z" }); // terminou depois

    expect(await linkAccount(db, ANON2, USER)).toBe(ANON);
    expect(await plays(ANON)).toEqual([
      { date: "2026-11-07", solved: 1, points: 100 },
      { date: "2026-11-08", solved: 1, points: 100 },
      { date: "2026-11-09", solved: 3, points: 60 },
    ]);
    // as perdedoras ficam guardadas no anônimo juntado, nada é apagado
    expect(await plays(ANON2)).toEqual([
      { date: "2026-11-08", solved: 5, points: 20 },
      { date: "2026-11-09", solved: 1, points: 100 },
    ]);
    expect(await anonymousUsable(db.exec, ANON2)).toBe(false);
  });

  it("hoje em andamento nos dois: fica a da conta; terminada no anônimo ganha", async () => {
    await addPlayer(db, ANON);
    await linkAccount(db, ANON, USER);
    await addPlay(db, ANON, "2026-11-10", { finished: false });
    await addPlayer(db, ANON2);
    await addPlay(db, ANON2, "2026-11-10", { solvedAt: 2 });
    await linkAccount(db, ANON2, USER);
    expect(await plays(ANON)).toEqual([{ date: "2026-11-10", solved: 2, points: 80 }]);
  });
});
