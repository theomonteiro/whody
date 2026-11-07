// Corretor de palpites. Puro (sem banco), roda só no servidor via lib/game/service.ts.

export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

export function tolerance(normalizedGuess: string): number {
  const n = normalizedGuess.length;
  if (n <= 5) return 0;
  if (n <= 10) return 1;
  return 2;
}

function minDistance(guess: string, names: readonly string[]): number {
  let best = Infinity;
  for (const name of names) {
    const d = levenshtein(guess, normalize(name));
    if (d < best) best = d;
  }
  return best;
}

export type Verdict = "empty" | "correct" | "wrong";

/**
 * Acerto só se a distância até a resposta estiver dentro da tolerância
 * e for estritamente menor que a distância até qualquer outra pessoa.
 */
export function judgeGuess(
  rawGuess: string,
  answerNames: readonly string[],
  otherPeopleNames: readonly (readonly string[])[],
): Verdict {
  const guess = normalize(rawGuess);
  if (guess.length === 0) return "empty";
  const toAnswer = minDistance(guess, answerNames);
  if (toAnswer > tolerance(guess)) return "wrong";
  for (const names of otherPeopleNames) {
    if (minDistance(guess, names) <= toAnswer) return "wrong";
  }
  return "correct";
}
