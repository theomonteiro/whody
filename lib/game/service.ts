import "server-only";
import type { Sql, TransactionSql } from "postgres";
import { db } from "@/lib/db";
import { defaultLocale } from "@/i18n/config";
import { gameDate, isoWeekNumber, nextPuzzleAt, weekDates } from "@/lib/time";
import { judgeGuess, normalize } from "./judge";
import { CLUE_COUNT, pointsForClue } from "./rules";
import type { Album, AlbumDay, GameState, GameStatus, GuessResponse, PublicClue } from "./types";

const MAX_GUESS_LENGTH = 80;

type Puzzle = { number: number; date: string; person_id: string };

type Attempt = { guess: string; correct: boolean; at: string };

type PlayRow = {
  attempts: Attempt[];
  solved_at_clue: number | null;
  points: number;
  finished_at: Date | null;
};

type Query = Sql | TransactionSql;

export async function getPuzzle(date: string = gameDate()): Promise<Puzzle | null> {
  const [row] = await db()<Puzzle[]>`
    select number, date::text as date, person_id from daily_puzzles where date = ${date}`;
  return row ?? null;
}

async function getPlay(q: Query, playerId: string, puzzleNumber: number): Promise<PlayRow | null> {
  const [row] = await q<PlayRow[]>`
    select attempts, solved_at_clue, points, finished_at
    from plays where player_id = ${playerId} and puzzle_number = ${puzzleNumber}`;
  return row ?? null;
}

function statusOf(play: PlayRow | null): GameStatus {
  if (!play?.finished_at) return "playing";
  return play.solved_at_clue ? "solved" : "failed";
}

/** Quantas pistas estão abertas: 1 + erros, até 6. Depois do fim, todas. */
function openCount(play: PlayRow | null): number {
  if (play?.finished_at) return play.solved_at_clue ?? CLUE_COUNT;
  const wrong = play?.attempts.filter((a) => !a.correct).length ?? 0;
  return Math.min(CLUE_COUNT, wrong + 1);
}

async function ensurePlay(q: Query, playerId: string, puzzleNumber: number) {
  await q`insert into players (id) values (${playerId}) on conflict (id) do nothing`;
  await q`
    insert into plays (player_id, puzzle_number) values (${playerId}, ${puzzleNumber})
    on conflict (player_id, puzzle_number) do nothing`;
}

/** Marca o início do jogo do dia (a pista 1 abriu). Idempotente. */
export async function startPlay(playerId: string, puzzleNumber: number): Promise<boolean> {
  const puzzle = await getPuzzle();
  if (!puzzle || puzzle.number !== puzzleNumber) return false;
  await ensurePlay(db(), playerId, puzzleNumber);
  return true;
}

export async function getStreak(playerId: string | null, today: string = gameDate()): Promise<number> {
  if (!playerId) return 0;
  // Dias seguidos jogados (acertando ou não), contados sobre os dias que tiveram pessoa.
  // O dia de hoje ainda sem jogo não quebra a sequência.
  const rows = await db()<{ date: string; done: boolean }[]>`
    select d.date::text as date, (p.finished_at is not null) as done
    from daily_puzzles d
    left join plays p on p.puzzle_number = d.number and p.player_id = ${playerId}
    where d.date <= ${today}
    order by d.date desc
    limit 1000`;
  let streak = 0;
  for (const row of rows) {
    if (row.done) streak++;
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

export async function buildState(playerId: string | null, puzzle: Puzzle): Promise<GameState> {
  const sql = db();
  const play = playerId ? await getPlay(sql, playerId, puzzle.number) : null;
  const status = statusOf(play);
  const open = openCount(play);
  const finished = status !== "playing";

  // Só busca no banco o texto das pistas que o jogador já pode ver.
  const visible = finished ? CLUE_COUNT : open;
  const clueRows = await sql<{ position: number; text: string; source_urls: string[] }[]>`
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
    attempts: (play?.attempts ?? []).map((a) => ({ guess: a.guess, correct: a.correct })),
    solvedAtClue: play?.solved_at_clue ?? null,
    points: play?.points ?? 0,
    reveal,
    stats: { weekPoints: week, streak },
    nextPuzzleAt: nextPuzzleAt(),
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
  if (!normalized) return { outcome: "empty", state: await buildState(playerId, puzzle) };

  const outcome = await db().begin(async (tx) => {
    await ensurePlay(tx, playerId, puzzle.number);
    const [play] = await tx<PlayRow[]>`
      select attempts, solved_at_clue, points, finished_at from plays
      where player_id = ${playerId} and puzzle_number = ${puzzle.number}
      for update`;
    if (play.finished_at) return "finished" as const;
    if (play.attempts.some((a) => normalize(a.guess) === normalized)) return "repeated" as const;

    const people = await tx<{ id: string; accepted_names: string[] }[]>`
      select id, accepted_names from people where locale = ${defaultLocale}`;
    const answer = people.find((p) => p.id === puzzle.person_id);
    if (!answer) throw new Error(`pessoa ${puzzle.person_id} não encontrada`);
    const others = people.filter((p) => p.id !== puzzle.person_id).map((p) => p.accepted_names);
    const correct = judgeGuess(guess, answer.accepted_names, others) === "correct";

    const clue = openCount(play);
    const attempts: Attempt[] = [...play.attempts, { guess, correct, at: new Date().toISOString() }];
    const failed = !correct && clue >= CLUE_COUNT;

    await tx`
      update plays set
        attempts = ${tx.json(attempts)},
        solved_at_clue = ${correct ? clue : null},
        points = ${correct ? pointsForClue(clue) : 0},
        finished_at = ${correct || failed ? new Date() : null}
      where player_id = ${playerId} and puzzle_number = ${puzzle.number}`;

    return correct ? ("correct" as const) : failed ? ("failed" as const) : ("wrong" as const);
  });

  return { outcome, state: await buildState(playerId, puzzle) };
}

export async function getAlbum(playerId: string | null, today: string = gameDate()): Promise<Album> {
  const dates = weekDates(today);
  const rows = await db()<
    {
      number: number;
      date: string;
      points: number | null;
      solved_at_clue: number | null;
      finished: boolean;
      display_name: string;
      portrait_url: string | null;
    }[]
  >`
    select d.number, d.date::text as date, p.points, p.solved_at_clue,
           (p.finished_at is not null) as finished, pe.display_name, pe.portrait_url
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
    if (!row.finished) return { ...base, status: date === today ? "today" : "missed" };
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

