// Rankings, grupos e streak contra um Postgres de verdade em memória (PGlite), com as migrations.
// Nada aqui toca no banco de produção.
import { beforeEach, describe, expect, it } from "vitest";
import { addPlay, addPlayer, seedPuzzles, testDb } from "../test-db";
import type { Db } from "../sql";
import { addDays } from "../time";
import { createGroup, groupBoard, isMember, joinGroup, leaveGroup, myGroups, newInviteCode, pastAlbums } from "./queries";

const ANA = "00000000-0000-4000-8000-00000000000a";
const BIA = "00000000-0000-4000-8000-00000000000b";
const CAIO = "00000000-0000-4000-8000-00000000000c";
const ESTRANHO = "00000000-0000-4000-8000-00000000000e";

function dates(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

let db: Db;

async function groupWith(...players: string[]) {
  const g = await createGroup(db, players[0], "Amigos");
  if (g === "too-many") throw new Error();
  for (const p of players.slice(1)) await joinGroup(db, p, g.inviteCode);
  return g;
}

const positions = (board: NonNullable<Awaited<ReturnType<typeof groupBoard>>>, period: "day" | "week" | "month" | "all") =>
  board.rankings[period].rows.map((r) => `${r.position}:${r.name}:${r.points}`);

beforeEach(async () => {
  db = await testDb();
  await seedPuzzles(db, dates("2026-10-26", "2026-11-30"));
  await addPlayer(db, ANA, "Ana", "10000000-0000-4000-8000-00000000000a");
  await addPlayer(db, BIA, "Bia", "10000000-0000-4000-8000-00000000000b");
  await addPlayer(db, CAIO, "Caio", "10000000-0000-4000-8000-00000000000c");
  await addPlayer(db, ESTRANHO, "Estranho", "10000000-0000-4000-8000-00000000000e");
}, 30_000);

describe("grupos", () => {
  it("cria, convida, entra e sai", async () => {
    const g = await createGroup(db, ANA, "Amigos");
    if (g === "too-many") throw new Error();
    expect(g.inviteCode).toMatch(/^[A-Z2-9]{8}$/);
    expect(await joinGroup(db, BIA, g.inviteCode)).toEqual({ groupId: g.id });
    expect(await joinGroup(db, BIA, g.inviteCode)).toEqual({ groupId: g.id }); // entrar de novo não duplica
    expect((await myGroups(db.exec, BIA)).map((x) => [x.name, x.members])).toEqual([["Amigos", 2]]);

    expect(await leaveGroup(db.exec, BIA, g.id)).toBe(true);
    expect(await isMember(db.exec, BIA, g.id)).toBe(false);
    expect(await myGroups(db.exec, BIA)).toEqual([]);
    expect(await joinGroup(db, BIA, "ZZZZZZZZ")).toBe("not-found");
  });

  it("um jogador pode estar em vários grupos", async () => {
    await groupWith(ANA, BIA);
    const g2 = await createGroup(db, CAIO, "Trabalho");
    if (g2 === "too-many") throw new Error();
    await joinGroup(db, ANA, g2.inviteCode);
    expect((await myGroups(db.exec, ANA)).map((g) => g.name)).toEqual(["Amigos", "Trabalho"]);
  });

  it("quem não é membro não vê nada do grupo", async () => {
    const g = await groupWith(ANA, BIA);
    expect(await groupBoard(db.exec, ESTRANHO, g.id, "2026-11-09")).toBeNull();
    // grupo inexistente responde igual
    expect(await groupBoard(db.exec, ESTRANHO, "00000000-0000-4000-8000-000000000999", "2026-11-09")).toBeNull();
    await leaveGroup(db.exec, BIA, g.id);
    expect(await groupBoard(db.exec, BIA, g.id, "2026-11-09")).toBeNull();
  });

  it("gera códigos sem letras ambíguas", () => {
    expect(newInviteCode(() => new Uint8Array(8).fill(0))).toBe("AAAAAAAA");
    for (let i = 0; i < 50; i++) expect(newInviteCode()).not.toMatch(/[01OIL]/);
  });
});

describe("rankings", () => {
  it("semanal vai de segunda a domingo e vira na segunda", async () => {
    const g = await groupWith(ANA, BIA);
    // semana de 2 a 8/11 (seg a dom)
    await addPlay(db, ANA, "2026-11-02", { solvedAt: 1 }); // 100
    await addPlay(db, ANA, "2026-11-08", { solvedAt: 1 }); // 100, domingo
    await addPlay(db, BIA, "2026-11-08", { solvedAt: 2 }); // 80
    await addPlay(db, BIA, "2026-11-09", { solvedAt: 1 }); // 100, segunda seguinte

    const sunday = (await groupBoard(db.exec, ANA, g.id, "2026-11-08"))!;
    expect(positions(sunday, "week")).toEqual(["1:Ana:200", "2:Bia:80"]);

    const monday = (await groupBoard(db.exec, ANA, g.id, "2026-11-09"))!;
    expect(positions(monday, "week")).toEqual(["1:Bia:100", "2:Ana:0"]);
    expect(positions(monday, "all")).toEqual(["1:Ana:200", "2:Bia:180"]);
  });

  it("mensal vira no dia 1", async () => {
    const g = await groupWith(ANA, BIA);
    await addPlay(db, ANA, "2026-10-31", { solvedAt: 1 });
    await addPlay(db, BIA, "2026-11-01", { solvedAt: 3 });

    const oct = (await groupBoard(db.exec, ANA, g.id, "2026-10-31"))!;
    expect(positions(oct, "month")).toEqual(["1:Ana:100", "2:Bia:0"]);
    const nov = (await groupBoard(db.exec, ANA, g.id, "2026-11-01"))!;
    expect(positions(nov, "month")).toEqual(["1:Bia:60", "2:Ana:0"]);
    // a semana de 26/10 a 1/11 atravessa os dois meses
    expect(positions(nov, "week")).toEqual(["1:Ana:100", "2:Bia:60"]);
  });

  it("empate de verdade: desempata por Diamantes, depois streak, depois tempo", async () => {
    const g = await groupWith(ANA, BIA, CAIO);
    // Ana: 100 + 0 = 100 com 1 Diamante. Bia: 60 + 40 = 100, sem Diamante.
    await addPlay(db, ANA, "2026-11-09", { solvedAt: 1 });
    await addPlay(db, ANA, "2026-11-10", { solvedAt: null });
    await addPlay(db, BIA, "2026-11-09", { solvedAt: 3 });
    await addPlay(db, BIA, "2026-11-10", { solvedAt: 4 });
    const b = (await groupBoard(db.exec, ANA, g.id, "2026-11-10"))!;
    expect(positions(b, "week")).toEqual(["1:Ana:100", "2:Bia:100", "3:Caio:0"]);
    expect(b.rankings.week.ties.map((t) => [t.points, t.decidedBy])).toEqual([[100, ["diamonds"]]]);
  });

  it("empate de pontos e Diamantes: maior streak no período vence", async () => {
    const g = await groupWith(ANA, BIA);
    await addPlay(db, ANA, "2026-11-09", { solvedAt: 3 }); // 60
    await addPlay(db, ANA, "2026-11-10", { solvedAt: 5 }); // 20 → 80, streak 2
    await addPlay(db, BIA, "2026-11-10", { solvedAt: 2 }); // 80, streak 1
    const b = (await groupBoard(db.exec, BIA, g.id, "2026-11-10"))!;
    expect(positions(b, "week")).toEqual(["1:Ana:80", "2:Bia:80"]);
    expect(b.rankings.week.ties[0].decidedBy).toEqual(["streak"]);
  });

  it("empate em tudo menos o tempo: menor tempo total vence", async () => {
    const g = await groupWith(ANA, BIA);
    await addPlay(db, ANA, "2026-11-10", { solvedAt: 2, seconds: 40 });
    await addPlay(db, BIA, "2026-11-10", { solvedAt: 2, seconds: 12 });
    const b = (await groupBoard(db.exec, ANA, g.id, "2026-11-10"))!;
    expect(positions(b, "day")).toEqual(["1:Bia:80", "2:Ana:80"]);
    expect(b.rankings.day.ties[0].decidedBy).toEqual(["time"]);
  });

  it("empate total fica com a mesma posição", async () => {
    const g = await groupWith(ANA, BIA);
    await addPlay(db, ANA, "2026-11-10", { solvedAt: 2, seconds: 20 });
    await addPlay(db, BIA, "2026-11-10", { solvedAt: 2, seconds: 20 });
    const b = (await groupBoard(db.exec, ANA, g.id, "2026-11-10"))!;
    expect(positions(b, "day")).toEqual(["1:Ana:80", "1:Bia:80"]);
    expect(b.rankings.day.ties[0].decidedBy).toEqual([]);
  });

  it("hoje em andamento não conta; dia passado abandonado conta como jogado com 0", async () => {
    const g = await groupWith(ANA, BIA);
    await addPlay(db, ANA, "2026-11-09", { finished: false }); // ontem, saiu no meio
    await addPlay(db, ANA, "2026-11-10", { finished: false }); // hoje, jogando
    const b = (await groupBoard(db.exec, BIA, g.id, "2026-11-10"))!;
    const ana = b.rankings.week.rows.find((r) => r.name === "Ana")!;
    expect(ana.daysPlayed).toBe(1);
    expect(ana.responseMs).toBe(150_000);
    expect(b.today.map((t) => [t.name, t.status])).toEqual([
      ["Ana", "pending"],
      ["Bia", "pending"],
    ]);
  });

  it("todo período: soma, média por dia jogado e álbuns Diamante", async () => {
    const g = await groupWith(ANA, BIA);
    // semana de 2 a 8/11 inteira com Diamante: 700 (álbum Diamante ★)
    for (const d of dates("2026-11-02", "2026-11-08")) await addPlay(db, ANA, d, { solvedAt: 1 });
    // semana seguinte: 2 dias, 160
    await addPlay(db, ANA, "2026-11-09", { solvedAt: 2 });
    await addPlay(db, ANA, "2026-11-10", { solvedAt: 2 });
    const b = (await groupBoard(db.exec, BIA, g.id, "2026-11-10"))!;
    expect(positions(b, "all")).toEqual(["1:Ana:860", "2:Bia:0"]);
    const ana = b.rankings.all.rows.find((r) => r.name === "Ana")!;
    expect(b.allTime[ana.playerId]).toEqual({ average: 96, diamondAlbums: 1 });
    expect(b.weekAlbum[ana.playerId]).toEqual({ rarity: "common", star: false });
  });

  it("streak do grupo e Hoje: quem jogou mostra pista e pontos, quem não jogou fica pendente", async () => {
    const g = await groupWith(ANA, BIA, CAIO);
    for (const d of dates("2026-11-05", "2026-11-09")) await addPlay(db, BIA, d, { solvedAt: 4 });
    await addPlay(db, ANA, "2026-11-09", { solvedAt: 6 });
    await addPlay(db, ANA, "2026-11-10", { solvedAt: 2 });
    const b = (await groupBoard(db.exec, CAIO, g.id, "2026-11-10"))!;
    const by = (n: string) => b.members.find((m) => m.name === n)!.playerId;
    expect(b.streaks[by("Bia")]).toEqual({ current: 5, best: 5 }); // hoje ainda não jogou: não quebra
    expect(b.streaks[by("Ana")]).toEqual({ current: 2, best: 2 });
    expect(b.streaks[by("Caio")]).toEqual({ current: 0, best: 0 });
    expect(b.today.map((t) => [t.name, t.status, t.solvedAtClue, t.points])).toEqual([
      ["Ana", "done", 2, 80],
      ["Bia", "pending", null, 0],
      ["Caio", "pending", null, 0],
    ]);
  });

  it("a tela do grupo nunca traz a pessoa do dia", async () => {
    const g = await groupWith(ANA, BIA);
    await addPlay(db, ANA, "2026-11-10", { solvedAt: 1 });
    const b = await groupBoard(db.exec, ANA, g.id, "2026-11-10");
    const json = JSON.stringify(b);
    expect(json).not.toContain("Pessoa");
    expect(json).not.toContain("pessoa");
  });
});

describe("coleção de álbuns", () => {
  it("lista as semanas anteriores com pontos e Diamantes", async () => {
    for (const d of dates("2026-10-26", "2026-11-01")) await addPlay(db, ANA, d, { solvedAt: 1 });
    await addPlay(db, ANA, "2026-11-03", { solvedAt: 3 });
    await addPlay(db, ANA, "2026-11-10", { solvedAt: 1 }); // semana atual: fora
    expect(await pastAlbums(db.exec, ANA, "2026-11-09")).toEqual([
      { weekStart: "2026-11-02", points: 60, diamonds: 0, daysPlayed: 1 },
      { weekStart: "2026-10-26", points: 700, diamonds: 7, daysPlayed: 7 },
    ]);
  });
});
