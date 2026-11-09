import { describe, expect, it } from "vitest";
import { rank, type RankStats } from "./ranking";

type E = RankStats & { name: string };
const e = (name: string, points: number, more: Partial<RankStats> = {}): E => ({
  name,
  points,
  diamonds: 0,
  bestStreak: 1,
  responseMs: 60_000,
  daysPlayed: 1,
  ...more,
});
const names = (r: ReturnType<typeof rank<E>>) => r.rows.map((x) => `${x.position}:${x.name}`);

describe("ranking e desempate", () => {
  it("ordena por pontos", () => {
    const r = rank([e("a", 100), e("b", 300), e("c", 200)]);
    expect(names(r)).toEqual(["1:b", "2:c", "3:a"]);
    expect(r.ties).toEqual([]);
  });

  it("empate de pontos: decide por figurinhas Diamante", () => {
    const r = rank([e("a", 300, { diamonds: 1 }), e("b", 300, { diamonds: 2 })]);
    expect(names(r)).toEqual(["1:b", "2:a"]);
    expect(r.ties).toHaveLength(1);
    expect(r.ties[0].points).toBe(300);
    expect(r.ties[0].decidedBy).toEqual(["diamonds"]);
  });

  it("depois por maior streak, depois por tempo total (menor vence)", () => {
    const streak = rank([e("a", 200, { bestStreak: 2 }), e("b", 200, { bestStreak: 5 })]);
    expect(names(streak)).toEqual(["1:b", "2:a"]);
    expect(streak.ties[0].decidedBy).toEqual(["streak"]);

    const time = rank([e("a", 200, { responseMs: 90_000 }), e("b", 200, { responseMs: 30_000 })]);
    expect(names(time)).toEqual(["1:b", "2:a"]);
    expect(time.ties[0].decidedBy).toEqual(["time"]);
  });

  it("empate total divide a posição (1, 1, 3)", () => {
    const r = rank([e("a", 200), e("b", 200), e("c", 100)], (x, y) => x.name.localeCompare(y.name));
    expect(names(r)).toEqual(["1:a", "1:b", "3:c"]);
    expect(r.ties[0].decidedBy).toEqual([]);
  });

  it("um grupo de empate com dois critérios diferentes lista os dois, na ordem do desempate", () => {
    const r = rank([
      e("a", 200, { responseMs: 10_000 }),
      e("b", 200, { diamonds: 1 }),
      e("c", 200, { responseMs: 99_000 }),
    ]);
    expect(names(r)).toEqual(["1:b", "2:a", "3:c"]);
    expect(r.ties[0].decidedBy).toEqual(["diamonds", "time"]);
  });

  it("só mostra empate quando é de verdade: quem não jogou empatado em 0 não gera linha", () => {
    const r = rank([e("a", 100), e("b", 0, { daysPlayed: 0, bestStreak: 0, responseMs: 0 }), e("c", 0, { daysPlayed: 0, bestStreak: 0, responseMs: 0 })]);
    expect(r.ties).toEqual([]);
    expect(names(r)).toEqual(["1:a", "2:b", "2:c"]);
  });

  it("quem jogou e fez 0 fica na frente de quem não jogou (streak 1 × 0)", () => {
    const r = rank([e("nao-jogou", 0, { daysPlayed: 0, bestStreak: 0, responseMs: 0 }), e("jogou", 0, { responseMs: 150_000 })]);
    expect(names(r)).toEqual(["1:jogou", "2:nao-jogou"]);
    expect(r.ties[0].decidedBy).toEqual(["streak"]);
  });
});
