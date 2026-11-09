// Streak: dias seguidos jogados (acertando ou não), contados só sobre os dias que tiveram pessoa.
// Dia passado com partida começada conta como jogado (o cronômetro já esgotou tudo).
// Hoje só conta depois de terminar, e hoje ainda sem fim não quebra a sequência.

export type StreakDay = { date: string; started: boolean; finished: boolean };

export type StreakStats = { current: number; best: number };

export function streakStats(days: readonly StreakDay[], today: string): StreakStats {
  const sorted = days.filter((d) => d.date <= today).sort((a, b) => (a.date < b.date ? -1 : 1));
  let run = 0;
  let best = 0;
  let current = 0;
  for (const day of sorted) {
    const isToday = day.date === today;
    const done = isToday ? day.finished : day.started;
    if (done) {
      run++;
      best = Math.max(best, run);
      current = run;
    } else if (!isToday) {
      run = 0;
      current = 0;
    }
  }
  return { current, best };
}
