import "server-only";
import type { Sql, TransactionSql } from "postgres";
import { db } from "@/lib/db";
import { defaultLocale } from "@/i18n/config";
import { gameDate, isoWeekNumber, nextPuzzleAt, weekDates } from "@/lib/time";
import { applyGuess, clueDeadline, currentClue, expire, pointsOf, type Attempt, type Timeline } from "./clock";
import { judgeGuess, normalize } from "./judge";
import { CLUE_COUNT, pointsForClue } from "./rules";
import type { Album, AlbumDay, GameState, GameStatus, GuessOutcome, GuessResponse, PublicClue } from "./types";

const MAX_GUESS_LENGTH = 80;

type Puzzle = { number: number; date: string; person_id: string };

type PlayRow = {
  attempts: Attempt[];
  solved_at_clue: number | null;
  started_at: Date;
  finished_at: Date | null;
};

type Query = Sql | TransactionSql;

export async function getPuzzle(date: string = gameDate()): Promise<Puzzle | null> {
  const [row] = await db()<Puzzle[]>`
    select number, date::text as date, person_id from daily_puzzles where date = ${date}`;
  return row ?? null;
}

function toTimeline(play: PlayRow): Timeline {
  return {
    startedAt: play.started_at.getTime(),
    attempts: play.attempts,
    finishedAt: play.finished_at?.getTime() ?? null,
    solvedAtClue: play.solved_at_clue,
  };
}

async function savePlay(q: Query, playerId: string, puzzleNumber: number, t: Timeline) {
  await q`
    update plays set
      attempts = ${q.json(t.attempts)},
      solved_at_clue = ${t.solvedAtClue},
      points = ${pointsOf(t)},
      finished_at = ${t.finishedAt === null ? null : new Date(t.finishedAt)}
    where player_id = ${playerId} and puzzle_number = ${puzzleNumber}`;
}

/**
 * Lê a partida travando a linha e aplica os tempos esgotados até `now`.
 * O cronômetro corre no servidor: sair ou recarregar não pausa nada.
 */
async function lockAndExpire(tx: TransactionSql, playerId: string, puzzleNumber: number, now: number) {
  const [play] = await tx<PlayRow[]>`
    select attempts, solved_at_clue, started_at, finished_at from plays
    where player_id = ${playerId} and puzzle_number = ${puzzleNumber}
    for update`;
  if (!play) return null;
  const before = toTimeline(play);
  const after = expire(before, now);
  if (after !== before) await savePlay(tx, playerId, puzzleNumber, after);
  return after;
}

function statusOf(t: Timeline | null): GameStatus {
  if (!t) return "not-started";
  if (t.finishedAt === null) return "playing";
  return t.solvedAtClue ? "solved" : "failed";
}

/** Pistas abertas: nenhuma antes do início; 1 + erros durante; até a do acerto (ou todas) no fim. */
function openCount(t: Timeline | null): number {
  if (!t) return 0;
  if (t.finishedAt !== null) return t.solvedAtClue ?? CLUE_COUNT;
  return currentClue(t);
}

/**
 * Cria a partida do dia e abre a pista 1 (início do cronômetro). Idempotente: tocar em
 * "Começar" de novo, ou em outra aba, devolve a mesma partida sem reiniciar o tempo.
 */
export async function startPlay(playerId: string, puzzleNumber: number): Promise<GameState | null> {
  const puzzle = await getPuzzle();
  if (!puzzle || puzzle.number !== puzzleNumber) return null;
  await db().begin(async (tx) => {
    await tx`insert into players (id) values (${playerId}) on conflict (id) do nothing`;
    await tx`
      insert into plays (player_id, puzzle_number, started_at) values (${playerId}, ${puzzle.number}, now())
      on conflict (player_id, puzzle_number) do nothing`;
  });
  return getState(playerId, puzzle);
}

/** Estado atual do dia pro jogador, com os tempos esgotados já aplicados. */
export async function getState(playerId: string | null, puzzle: Puzzle): Promise<GameState> {
  const now = Date.now();
  const timeline = playerId ? await db().begin((tx) => lockAndExpire(tx, playerId, puzzle.number, now)) : null;
  return buildState(playerId, puzzle, timeline, now);
}

export async function getStreak(playerId: string | null, today: string = gameDate()): Promise<number> {
  if (!playerId) return 0;
  // Dias seguidos jogados (acertando ou não), contados sobre os dias que tiveram pessoa.
  // Dia passado com partida começada conta como jogado: o cronômetro já esgotou tudo.
  // O dia de hoje ainda sem fim não quebra a sequência.
  const rows = await db()<{ date: string; started: boolean; finished: boolean }[]>`
    select d.date::text as date, (p.player_id is not null) as started, (p.finished_at is not null) as finished
    from daily_puzzles d
    left join plays p on p.puzzle_number = d.number and p.player_id = ${playerId}
    where d.date <= ${today}
    order by d.date desc
    limit 1000`;
  let streak = 0;
  for (const row of rows) {
    const done = row.date === today ? row.finished : row.started;
    if (done) streak++;
    else if (row.date === today) continue;
    else break;
  }
  return streak;
}

async function weekPoints(playerId: string | null, today: string): Promise<number> {
  if (!playerId) return 0;
  const days = weekDates(today);
  const [row] = await db()<{ total: number }[]>`
    select coalesce(sum(p.points), 0)::int as total
    from plays p join daily_puzzles d on d.number = p.puzzle_number
    where p.player_id = ${playerId} and p.finished_at is not null
      and d.date between ${days[0]} and ${days[6]}`;
  return row.total;
}

async function buildState(
  playerId: string | null,
  puzzle: Puzzle,
  timeline: Timeline | null,
  now: number,
): Promise<GameState> {
  const sql = db();
  const status = statusOf(timeline);
  const open = openCount(timeline);
  const finished = status === "solved" || status === "failed";

  // Só busca no banco o texto das pistas que o jogador já pode ver (nenhuma antes do "Começar").
  const visible = finished ? CLUE_COUNT : open;
  const clueRows =
    visible === 0
      ? []
      : await sql<{ position: number; text: string; source_urls: string[] }[]>`
          select position, text, source_urls from clues
          where person_id = ${puzzle.person_id} and locale = ${defaultLocale} and position <= ${visible}
          order by position`;
  const textByPosition = new Map(clueRows.map((c) => [c.position, c.text]));

  const clues: PublicClue[] = Array.from({ length: CLUE_COUNT }, (_, i) => {
    const position = i + 1;
    const value = pointsForClue(position);
    const text = position <= open ? textByPosition.get(position) : undefined;
    return text === undefined ? { position, value, open: false } : { position, value, open: true, text };
  });

  let reveal: GameState["reveal"] = null;
  if (finished) {
    const [person] = await sql<
      { display_name: string; short_bio: string; years: string; portrait_url: string | null }[]
    >`select display_name, short_bio, years, portrait_url from people where id = ${puzzle.person_id}`;
    reveal = {
      displayName: person.display_name,
      shortBio: person.short_bio,
      years: person.years,
      portraitUrl: person.portrait_url,
      sources: clueRows.map((c) => ({ position: c.position, text: c.text, urls: c.source_urls })),
    };
  }

  const today = gameDate();
  const [streak, week] = await Promise.all([getStreak(playerId, today), weekPoints(playerId, today)]);

  return {
    puzzle: { number: puzzle.number, date: puzzle.date },
    status,
    openClues: open,
    clues,
    attempts: (timeline?.attempts ?? []).map((a) => ({
      guess: a.guess,
      correct: a.correct,
      timeout: a.timeout === true,
    })),
    solvedAtClue: timeline?.solvedAtClue ?? null,
    points: timeline ? pointsOf(timeline) : 0,
    reveal,
    stats: { weekPoints: week, streak },
    nextPuzzleAt: nextPuzzleAt(),
    clueDeadline: status === "playing" && timeline ? clueDeadline(timeline) : null,
    serverNow: now,
  };
}

export async function submitGuess(
  playerId: string,
  puzzleNumber: number,
  rawGuess: string,
): Promise<GuessResponse> {
  const puzzle = await getPuzzle();
  if (!puzzle || puzzle.number !== puzzleNumber) return { outcome: "stale", state: null };

  const guess = rawGuess.slice(0, MAX_GUESS_LENGTH).trim();
  const normalized = normalize(guess);
  const now = Date.now();

  const { outcome, timeline } = await db().begin(async (tx) => {
    // Os tempos esgotados entram antes: palpite atrasado vale pra pista em que o jogador está.
    const t = await lockAndExpire(tx, playerId, puzzle.number, now);
    const result = (o: GuessOutcome, next: Timeline | null = t) => ({ outcome: o, timeline: next });
    if (!t) return result("not-started");
    if (t.finishedAt !== null) return result("finished");
    if (!normalized) return result("empty");
    if (t.attempts.some((a) => !a.timeout && normalize(a.guess) === normalized)) return result("repeated");

    const people = await tx<{ id: string; accepted_names: string[] }[]>`
      select id, accepted_names from people where locale = ${defaultLocale}`;
    const answer = people.find((p) => p.id === puzzle.person_id);
    if (!answer) throw new Error(`pessoa ${puzzle.person_id} não encontrada`);
    const others = people.filter((p) => p.id !== puzzle.person_id).map((p) => p.accepted_names);
    const correct = judgeGuess(guess, answer.accepted_names, others) === "correct";

    const next = applyGuess(t, guess, correct, now);
    await savePlay(tx, playerId, puzzle.number, next);
    return result(correct ? "correct" : next.finishedAt !== null ? "failed" : "wrong", next);
  });

  return { outcome, state: await buildState(playerId, puzzle, timeline, now) };
}

export async function getAlbum(playerId: string | null, today: string = gameDate()): Promise<Album> {
  const dates = weekDates(today);
  const rows = await db()<
    {
      number: number;
      date: string;
      points: number | null;
      solved_at_clue: number | null;
      started: boolean;
      finished: boolean;
      display_name: string;
      portrait_url: string | null;
    }[]
  >`
    select d.number, d.date::text as date, p.points, p.solved_at_clue,
           (p.player_id is not null) as started, (p.finished_at is not null) as finished,
           pe.display_name, pe.portrait_url
    from daily_puzzles d
    join people pe on pe.id = d.person_id
    left join plays p on p.puzzle_number = d.number and p.player_id = ${playerId}
    where d.date between ${dates[0]} and ${dates[6]}`;
  const byDate = new Map(rows.map((r) => [r.date, r]));

  const days: AlbumDay[] = dates.map((date) => {
    const row = byDate.get(date);
    const base = { date, number: row?.number ?? null, points: 0, solvedAtClue: null, displayName: null, portraitUrl: null };
    if (date > today) return { ...base, status: "future" };
    if (!row) return { ...base, status: "no-puzzle" };
    // Hoje só conta depois do fim; dia passado começado já esgotou o cronômetro.
    const done = date === today ? row.finished : row.started;
    if (!done) return { ...base, status: date === today ? "today" : "missed" };
    const solved = row.solved_at_clue !== null;
    return {
      ...base,
      status: "played",
      points: row.points ?? 0,
      solvedAtClue: row.solved_at_clue,
      // Só mostra quem era depois que o jogador terminou aquele dia.
      displayName: solved ? row.display_name : null,
      portraitUrl: solved ? row.portrait_url : null,
    };
  });

  const played = days.filter((d) => d.status === "played");
  return {
    start: dates[0],
    end: dates[6],
    weekNumber: isoWeekNumber(today),
    days,
    points: played.reduce((sum, d) => sum + d.points, 0),
    diamonds: played.filter((d) => d.solvedAtClue === 1).length,
    daysPlayed: played.length,
    daysElapsed: days.filter((d) => d.date <= today && d.status !== "no-puzzle").length,
  };
}
