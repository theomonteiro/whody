import { describe, expect, it } from "vitest";
import { applyGuess, clueDeadline, currentClue, expire, pointsOf, type Timeline } from "./clock";
import { CLUE_SECONDS, GRACE_MS } from "./rules";

const START = Date.parse("2026-11-08T12:00:00Z");
const S = 1000;
const CLUE = CLUE_SECONDS * S;

const fresh = (): Timeline => ({ startedAt: START, attempts: [], finishedAt: null, solvedAtClue: null });

describe("expiração", () => {
  it("não expira antes do prazo nem dentro da tolerância", () => {
    expect(currentClue(expire(fresh(), START + CLUE - 1))).toBe(1);
    expect(currentClue(expire(fresh(), START + CLUE + GRACE_MS))).toBe(1);
  });

  it("abre a próxima pista depois do prazo + tolerância, contando do prazo exato", () => {
    const t = expire(fresh(), START + CLUE + GRACE_MS + 1);
    expect(currentClue(t)).toBe(2);
    expect(t.attempts).toEqual([
      { guess: "", correct: false, timeout: true, at: new Date(START + CLUE).toISOString() },
    ]);
    expect(clueDeadline(t)).toBe(START + 2 * CLUE);
  });

  it("recarregar depois de muito tempo encontra as pistas expiradas já abertas", () => {
    const t = expire(fresh(), START + 3 * CLUE + 10 * S);
    expect(currentClue(t)).toBe(4);
    expect(t.attempts.every((a) => a.timeout)).toBe(true);
    expect(t.finishedAt).toBeNull();
  });

  it("expirar a 6ª pista termina com 0 pontos, no prazo dela", () => {
    const t = expire(fresh(), START + 10 * 60 * S);
    expect(t.attempts).toHaveLength(6);
    expect(t.finishedAt).toBe(START + 6 * CLUE);
    expect(t.solvedAtClue).toBeNull();
    expect(pointsOf(t)).toBe(0);
  });

  it("é idempotente: chamar de novo com o mesmo instante não muda nada", () => {
    const now = START + 2 * CLUE + 5 * S;
    const once = expire(fresh(), now);
    expect(expire(once, now)).toEqual(once);
  });
});

describe("palpites com cronômetro", () => {
  it("palpite na tolerância vale pra pista atual", () => {
    const now = START + CLUE + GRACE_MS - 1;
    const t = applyGuess(expire(fresh(), now), "dumont", true, now);
    expect(t.solvedAtClue).toBe(1);
    expect(pointsOf(t)).toBe(100);
  });

  it("palpite atrasado vale pra pista em que o jogador realmente está", () => {
    const now = START + CLUE + 10 * S;
    const t = applyGuess(expire(fresh(), now), "dumont", true, now);
    expect(t.solvedAtClue).toBe(2);
    expect(pointsOf(t)).toBe(80);
  });

  it("erro abre a próxima pista na hora e reinicia o prazo", () => {
    const now = START + 7 * S;
    const t = applyGuess(fresh(), "pele", false, now);
    expect(currentClue(t)).toBe(2);
    expect(clueDeadline(t)).toBe(now + CLUE);
  });

  it("errar na 6ª pista termina o jogo", () => {
    let t = fresh();
    for (let i = 0; i < 6; i++) t = applyGuess(t, `x${i}`, false, START + i * S);
    expect(t.finishedAt).toBe(START + 5 * S);
    expect(pointsOf(t)).toBe(0);
  });

  it("depois do fim, nada muda", () => {
    const done = applyGuess(fresh(), "dumont", true, START + S);
    expect(applyGuess(done, "outro", false, START + 2 * S)).toBe(done);
    expect(expire(done, START + 10 * 60 * S)).toBe(done);
  });
});
