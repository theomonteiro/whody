// Ordem dos rankings e desempate. Puro: recebe os números já somados pelo SQL (lib/groups/queries.ts).
//
// Desempate, nessa ordem: 1) pontos, 2) figurinhas Diamante no período, 3) maior streak no período,
// 4) tempo total de resposta (menor vence). Se tudo empatar, a posição é a mesma (1, 1, 3…).

export type RankStats = {
  points: number;
  diamonds: number;
  /** Maior sequência de dias jogados dentro do período. */
  bestStreak: number;
  responseMs: number;
  daysPlayed: number;
};

export type TieCriterion = "diamonds" | "streak" | "time";

export type Ranked<T> = T & { position: number };

/** Um empate de pontos de verdade (entre quem jogou no período) e o que decidiu a ordem. */
export type TieNote<T> = {
  points: number;
  entries: Ranked<T>[];
  /** Critérios que separaram vizinhos, na ordem do desempate; vazio = empate total. */
  decidedBy: TieCriterion[];
};

export type Ranking<T> = { rows: Ranked<T>[]; ties: TieNote<T>[] };

/** Primeiro critério (depois dos pontos) em que `a` e `b` diferem; null = empate total. */
export function tieBreaker(a: RankStats, b: RankStats): TieCriterion | null {
  if (a.diamonds !== b.diamonds) return "diamonds";
  if (a.bestStreak !== b.bestStreak) return "streak";
  if (a.responseMs !== b.responseMs) return "time";
  return null;
}

export function compareStats(a: RankStats, b: RankStats): number {
  return (
    b.points - a.points ||
    b.diamonds - a.diamonds ||
    b.bestStreak - a.bestStreak ||
    a.responseMs - b.responseMs
  );
}

export function rank<T extends RankStats>(entries: readonly T[], tiebreak: (a: T, b: T) => number = () => 0): Ranking<T> {
  // `tiebreak` só define a ordem de exibição de quem empatou em tudo (ex.: por nome); não muda a posição.
  const sorted = [...entries].sort((a, b) => compareStats(a, b) || tiebreak(a, b));
  const rows: Ranked<T>[] = [];
  sorted.forEach((entry, i) => {
    const prev = rows[i - 1];
    const position = prev && compareStats(prev, entry) === 0 ? prev.position : i + 1;
    rows.push({ ...entry, position });
  });

  const ties: TieNote<T>[] = [];
  for (let i = 0; i < rows.length; ) {
    let j = i + 1;
    while (j < rows.length && rows[j].points === rows[i].points) j++;
    const group = rows.slice(i, j);
    if (group.length > 1 && group.some((r) => r.daysPlayed > 0)) {
      const decidedBy = new Set<TieCriterion>();
      for (let k = 1; k < group.length; k++) {
        const c = tieBreaker(group[k - 1], group[k]);
        if (c) decidedBy.add(c);
      }
      const order: TieCriterion[] = ["diamonds", "streak", "time"];
      ties.push({ points: rows[i].points, entries: group, decidedBy: order.filter((c) => decidedBy.has(c)) });
    }
    i = j;
  }
  return { rows, ties };
}
