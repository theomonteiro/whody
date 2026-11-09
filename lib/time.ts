// Datas do jogo. Tudo é calculado no fuso de Brasília; datas circulam como "YYYY-MM-DD".

export const GAME_TIME_ZONE = "America/Sao_Paulo";

/** Data do puzzle #1. O número de cada dia sai da distância até ela. */
export const PUZZLE_EPOCH = "2026-11-07";

const DAY_MS = 86_400_000;

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: GAME_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function gameDate(at: Date = new Date()): string {
  return dateFmt.format(at);
}

function toUtcDay(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return fromUtcDay(toUtcDay(iso) + days * DAY_MS);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtcDay(toIso) - toUtcDay(fromIso)) / DAY_MS);
}

/** Segunda-feira da semana (segunda a domingo) que contém a data. */
export function weekStart(iso: string): string {
  const dow = new Date(toUtcDay(iso)).getUTCDay(); // 0 = domingo
  return addDays(iso, -((dow + 6) % 7));
}

export function weekDates(iso: string): string[] {
  const start = weekStart(iso);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Número ISO da semana (o "nº 45" do álbum). */
export function isoWeekNumber(iso: string): number {
  const thursday = addDays(weekStart(iso), 3);
  const yearStart = `${thursday.slice(0, 4)}-01-01`;
  return Math.floor(daysBetween(yearStart, thursday) / 7) + 1;
}

export function puzzleNumberFor(iso: string): number {
  return daysBetween(PUZZLE_EPOCH, iso) + 1;
}

/** Diferença em ms entre o relógio do fuso e UTC naquele instante. */
function zoneOffsetMs(at: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GAME_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(at / 1000) * 1000;
}

/** Instante (ms UTC) da meia-noite de Brasília que começa a data. */
export function midnightAt(iso: string): number {
  const guess = toUtcDay(iso);
  return guess - zoneOffsetMs(guess - zoneOffsetMs(guess));
}

/** Instante em que a próxima pessoa é liberada. */
export function nextPuzzleAt(at: Date = new Date()): number {
  return midnightAt(addDays(gameDate(at), 1));
}

/** Primeiro dia do mês da data. */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export type Period = "day" | "week" | "month" | "all";

/**
 * Intervalo de datas (inclusivo) de cada ranking até `today`: diário = hoje; semanal = segunda
 * a hoje; mensal = dia 1 a hoje; todo período = desde o #1.
 */
export function periodRange(period: Period, today: string): { from: string; to: string } {
  switch (period) {
    case "day":
      return { from: today, to: today };
    case "week":
      return { from: weekStart(today), to: today };
    case "month":
      return { from: monthStart(today), to: today };
    case "all":
      return { from: PUZZLE_EPOCH, to: today };
  }
}
