// Cronômetro por pista. Puro (sem banco nem relógio próprio): o servidor passa `now`.
//
// A linha do tempo de uma partida sai de `startedAt` (pista 1 aberta) e das tentativas:
// cada tentativa errada ou tempo esgotado abre a próxima pista no instante `at` dela.
// Tempo esgotado entra como tentativa com `timeout: true` e `at` = prazo da pista.

import { CLUE_COUNT, CLUE_SECONDS, GRACE_MS, pointsForClue } from "./rules";

export type Attempt = { guess: string; correct: boolean; timeout?: boolean; at: string };

export type Timeline = {
  startedAt: number;
  attempts: Attempt[];
  finishedAt: number | null;
  solvedAtClue: number | null;
};

const CLUE_MS = CLUE_SECONDS * 1000;

/** Pista em que o jogador está (1–6): 1 + erros e tempos esgotados. */
export function currentClue(t: Timeline): number {
  const misses = t.attempts.filter((a) => !a.correct).length;
  return Math.min(CLUE_COUNT, misses + 1);
}

/** Quando a pista atual abriu (ms). */
export function clueOpenedAt(t: Timeline): number {
  const misses = t.attempts.filter((a) => !a.correct);
  const last = misses[misses.length - 1];
  return last ? Date.parse(last.at) : t.startedAt;
}

/** Prazo da pista atual (ms), sem a tolerância. */
export function clueDeadline(t: Timeline): number {
  return clueOpenedAt(t) + CLUE_MS;
}

/**
 * Aplica os tempos esgotados até `now`. Uma pista só expira depois do prazo + tolerância,
 * mas a seguinte abre no prazo exato, então ausência e recarga não pausam nada.
 */
export function expire(t: Timeline, now: number): Timeline {
  if (t.finishedAt !== null) return t;
  let attempts = t.attempts;
  let next: Timeline = t;
  while (next.finishedAt === null && now > clueDeadline(next) + GRACE_MS) {
    const deadline = clueDeadline(next);
    const lastClue = currentClue(next) >= CLUE_COUNT;
    attempts = [...attempts, { guess: "", correct: false, timeout: true, at: new Date(deadline).toISOString() }];
    next = { ...next, attempts, finishedAt: lastClue ? deadline : null };
  }
  return next;
}

/** Registra um palpite já julgado. Chame `expire` antes, com o mesmo `now`. */
export function applyGuess(t: Timeline, guess: string, correct: boolean, now: number): Timeline {
  if (t.finishedAt !== null) return t;
  const clue = currentClue(t);
  const attempts = [...t.attempts, { guess, correct, at: new Date(now).toISOString() }];
  if (correct) return { ...t, attempts, finishedAt: now, solvedAtClue: clue };
  return { ...t, attempts, finishedAt: clue >= CLUE_COUNT ? now : null };
}

export function pointsOf(t: Timeline): number {
  return t.solvedAtClue ? pointsForClue(t.solvedAtClue) : 0;
}
