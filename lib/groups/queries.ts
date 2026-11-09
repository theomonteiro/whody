// Grupos e rankings em SQL. Sem "server-only" pra rodar nos testes (PGlite); o app chama por
// lib/groups/service.ts. Toda leitura de grupo recebe o jogador e confere se ele é membro.
//
// Fuso: daily_puzzles.date já é a data de Brasília, e `today` vem de gameDate() (America/Sao_Paulo).
// Uma partida conta se terminou, ou se é de um dia que já passou (o cronômetro esgotou tudo).

import { albumRarity, type AlbumRarity } from "../game/rules";
import { streakStats, type StreakDay } from "../game/streak";
import { periodRange, type Period } from "../time";
import { rank, type RankStats, type Ranking } from "./ranking";
import { isUniqueViolation, type Db, type Exec } from "../sql";

export const GROUP_NAME_MAX = 40;
export const MAX_GROUPS_PER_PLAYER = 20;

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O, 1/I/L

export function newInviteCode(random: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  return Array.from(random(8), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function normalizeInviteCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(code) ? code : null;
}

export function cleanGroupName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (!name || Array.from(name).length > GROUP_NAME_MAX) return null;
  return name;
}

export type GroupSummary = { id: string; name: string; inviteCode: string; members: number };

export async function createGroup(db: Db, playerId: string, name: string): Promise<GroupSummary | "too-many"> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newInviteCode();
    try {
      return await db.tx(async (exec) => {
        const [{ count }] = await exec<{ count: number }>(
          `select count(*)::int as count from group_members where player_id = $1::uuid`,
          [playerId],
        );
        if (count >= MAX_GROUPS_PER_PLAYER) return "too-many" as const;
        const [group] = await exec<{ id: string }>(
          `insert into groups (name, invite_code, created_by) values ($1, $2, $3::uuid) returning id::text as id`,
          [name, code, playerId],
        );
        await exec(`insert into group_members (group_id, player_id) values ($1::uuid, $2::uuid)`, [group.id, playerId]);
        return { id: group.id, name, inviteCode: code, members: 1 };
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err; // código repetido: tenta outro
    }
  }
  throw new Error("não foi possível gerar um código de convite");
}

/** Só o nome do grupo, pra tela do convite (quem tem o código pode ver o nome e nada mais). */
export async function groupByInvite(exec: Exec, code: string): Promise<{ id: string; name: string } | null> {
  const [row] = await exec<{ id: string; name: string }>(
    `select id::text as id, name from groups where invite_code = $1`,
    [code],
  );
  return row ?? null;
}

export async function joinGroup(db: Db, playerId: string, code: string): Promise<{ groupId: string } | "not-found" | "too-many"> {
  return db.tx(async (exec) => {
    const group = await groupByInvite(exec, code);
    if (!group) return "not-found" as const;
    const [already] = await exec(
      `select 1 from group_members where group_id = $1::uuid and player_id = $2::uuid`,
      [group.id, playerId],
    );
    if (already) return { groupId: group.id };
    const [{ count }] = await exec<{ count: number }>(
      `select count(*)::int as count from group_members where player_id = $1::uuid`,
      [playerId],
    );
    if (count >= MAX_GROUPS_PER_PLAYER) return "too-many" as const;
    await exec(
      `insert into group_members (group_id, player_id) values ($1::uuid, $2::uuid) on conflict do nothing`,
      [group.id, playerId],
    );
    return { groupId: group.id };
  });
}

export async function leaveGroup(exec: Exec, playerId: string, groupId: string): Promise<boolean> {
  const rows = await exec(
    `delete from group_members where group_id = $1::uuid and player_id = $2::uuid returning 1`,
    [groupId, playerId],
  );
  return rows.length > 0;
}

export async function isMember(exec: Exec, playerId: string, groupId: string): Promise<boolean> {
  const [row] = await exec(`select 1 from group_members where group_id = $1::uuid and player_id = $2::uuid`, [groupId, playerId]);
  return !!row;
}

export async function myGroups(exec: Exec, playerId: string): Promise<GroupSummary[]> {
  return exec<GroupSummary>(
    `select g.id::text as id, g.name, g.invite_code as "inviteCode",
            (select count(*)::int from group_members x where x.group_id = g.id) as members
     from group_members m join groups g on g.id = m.group_id
     where m.player_id = $1::uuid
     order by m.joined_at`,
    [playerId],
  );
}

// ---------------------------------------------------------------------------------------------
// Rankings

export type MemberRow = { playerId: string; name: string | null; joinedAt: string };

type PeriodSums = { points: number; diamonds: number; responseMs: number; daysPlayed: number };

const PERIODS = ["day", "week", "month", "all"] as const satisfies readonly Period[];

/**
 * Soma por membro e período. `$2` = hoje; `$3`/`$4`/`$5` = início do dia, semana e mês.
 * Só olha membros do grupo `$1`.
 */
const PERIOD_SUMS_SQL = `
with members as (
  select m.player_id from group_members m where m.group_id = $1::uuid
),
counted as (
  select r.* from play_results r
  join members m on m.player_id = r.player_id
  where r.date <= $2::date and (r.finished or r.date < $2::date)
)
select m.player_id::text as "playerId",
  ${PERIODS.map((p, i) => {
    const cond = p === "all" ? "true" : `c.date >= $${i + 3}::date`;
    return `coalesce(sum(c.points) filter (where ${cond}), 0)::int as "${p}Points",
  count(*) filter (where ${cond} and c.solved_at_clue = 1)::int as "${p}Diamonds",
  coalesce(sum(c.response_ms) filter (where ${cond}), 0)::float8 as "${p}ResponseMs",
  count(c.player_id) filter (where ${cond})::int as "${p}DaysPlayed"`;
  }).join(",\n  ")}
from members m
left join counted c on c.player_id = m.player_id
group by m.player_id`;

/** Álbuns Diamante (semanas, segunda a domingo, com 601+ pontos) de cada membro. */
const DIAMOND_ALBUMS_SQL = `
select c.player_id::text as "playerId", count(*)::int as albums
from (
  select r.player_id, date_trunc('week', r.date) as week, sum(r.points) as total
  from play_results r
  join group_members m on m.player_id = r.player_id and m.group_id = $1::uuid
  where r.date <= $2::date and (r.finished or r.date < $2::date)
  group by r.player_id, date_trunc('week', r.date)
) c
where c.total >= 601
group by c.player_id`;

/** Todos os dias com pessoa até hoje, cruzados com as partidas dos membros (pras streaks). */
const STREAK_DAYS_SQL = `
select m.player_id::text as "playerId", d.date::text as date,
       (p.player_id is not null) as started, (p.finished_at is not null) as finished
from group_members m
cross join daily_puzzles d
left join plays p on p.player_id = m.player_id and p.puzzle_number = d.number
where m.group_id = $1::uuid and d.date <= $2::date
order by d.date`;

/** Partida de hoje de cada membro. */
const TODAY_SQL = `
select m.player_id::text as "playerId", (p.player_id is not null) as started, (p.finished_at is not null) as finished,
       p.solved_at_clue as "solvedAtClue", coalesce(p.points, 0)::int as points
from group_members m
left join daily_puzzles d on d.date = $2::date
left join plays p on p.player_id = m.player_id and p.puzzle_number = d.number
where m.group_id = $1::uuid`;

export type MemberStanding = RankStats & {
  playerId: string;
  name: string | null;
};

export type TodayEntry = {
  playerId: string;
  name: string | null;
  status: "done" | "pending";
  solvedAtClue: number | null;
  points: number;
};

export type GroupBoard = {
  group: { id: string; name: string; inviteCode: string };
  members: MemberRow[];
  rankings: Record<Period, Ranking<MemberStanding>>;
  /** Álbum da semana de cada membro (pela soma da semana). */
  weekAlbum: Record<string, AlbumRarity>;
  allTime: Record<string, { average: number; diamondAlbums: number }>;
  streaks: Record<string, { current: number; best: number }>;
  today: TodayEntry[];
};

/**
 * Tudo da tela do grupo. null se o grupo não existe OU se `viewerId` não é membro
 * (as duas respostas são iguais de propósito: quem não é membro não fica sabendo nada).
 */
export async function groupBoard(exec: Exec, viewerId: string, groupId: string, today: string): Promise<GroupBoard | null> {
  if (!(await isMember(exec, viewerId, groupId))) return null;

  const [group] = await exec<{ id: string; name: string; inviteCode: string }>(
    `select id::text as id, name, invite_code as "inviteCode" from groups where id = $1::uuid`,
    [groupId],
  );
  if (!group) return null;

  const members = await exec<MemberRow>(
    `select m.player_id::text as "playerId", p.name, m.joined_at::text as "joinedAt"
     from group_members m join players p on p.id = m.player_id
     where m.group_id = $1::uuid order by m.joined_at`,
    [groupId],
  );

  const starts = (["day", "week", "month"] as const).map((p) => periodRange(p, today).from);
  const [sums, albums, streakRows, todayRows] = await Promise.all([
    exec<Record<string, number | string>>(PERIOD_SUMS_SQL, [groupId, today, ...starts]),
    exec<{ playerId: string; albums: number }>(DIAMOND_ALBUMS_SQL, [groupId, today]),
    exec<StreakDay & { playerId: string }>(STREAK_DAYS_SQL, [groupId, today]),
    exec<{ playerId: string; started: boolean; finished: boolean; solvedAtClue: number | null; points: number }>(
      TODAY_SQL,
      [groupId, today],
    ),
  ]);

  const daysByPlayer = new Map<string, StreakDay[]>();
  for (const r of streakRows) {
    const list = daysByPlayer.get(r.playerId) ?? [];
    list.push({ date: r.date, started: r.started, finished: r.finished });
    daysByPlayer.set(r.playerId, list);
  }
  const sumsByPlayer = new Map(sums.map((s) => [String(s.playerId), s]));
  const nameOf = new Map(members.map((m) => [m.playerId, m.name]));
  const byName = (a: { name: string | null }, b: { name: string | null }) =>
    (a.name ?? "").localeCompare(b.name ?? "", "pt-BR");

  const streaks: GroupBoard["streaks"] = {};
  for (const m of members) streaks[m.playerId] = streakStats(daysByPlayer.get(m.playerId) ?? [], today);

  const rankings = {} as GroupBoard["rankings"];
  for (const period of PERIODS) {
    const { from } = periodRange(period, today);
    const entries: MemberStanding[] = members.map((m) => {
      const s = sumsByPlayer.get(m.playerId);
      const sum: PeriodSums = {
        points: Number(s?.[`${period}Points`] ?? 0),
        diamonds: Number(s?.[`${period}Diamonds`] ?? 0),
        responseMs: Number(s?.[`${period}ResponseMs`] ?? 0),
        daysPlayed: Number(s?.[`${period}DaysPlayed`] ?? 0),
      };
      const inPeriod = (daysByPlayer.get(m.playerId) ?? []).filter((d) => d.date >= from);
      return { playerId: m.playerId, name: m.name, ...sum, bestStreak: streakStats(inPeriod, today).best };
    });
    rankings[period] = rank(entries, byName);
  }

  const weekAlbum: GroupBoard["weekAlbum"] = {};
  const allTime: GroupBoard["allTime"] = {};
  const albumsByPlayer = new Map(albums.map((a) => [a.playerId, a.albums]));
  for (const row of rankings.week.rows) weekAlbum[row.playerId] = albumRarity(row.points);
  for (const row of rankings.all.rows) {
    allTime[row.playerId] = {
      average: row.daysPlayed ? Math.round(row.points / row.daysPlayed) : 0,
      diamondAlbums: albumsByPlayer.get(row.playerId) ?? 0,
    };
  }

  const today_: TodayEntry[] = todayRows
    .map((r) => ({
      playerId: r.playerId,
      name: nameOf.get(r.playerId) ?? null,
      status: r.finished ? ("done" as const) : ("pending" as const),
      solvedAtClue: r.finished ? r.solvedAtClue : null,
      points: r.finished ? r.points : 0,
    }))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "done" ? -1 : 1;
      const ra = rankings.day.rows.find((x) => x.playerId === a.playerId)?.position ?? 0;
      const rb = rankings.day.rows.find((x) => x.playerId === b.playerId)?.position ?? 0;
      return ra - rb || byName(a, b);
    });

  return { group, members, rankings, weekAlbum, allTime, streaks, today: today_ };
}

// ---------------------------------------------------------------------------------------------
// Perfil

export type PastAlbum = { weekStart: string; points: number; diamonds: number; daysPlayed: number };

/** Álbuns das semanas anteriores à atual (só as semanas em que o jogador jogou). */
export async function pastAlbums(exec: Exec, playerId: string, currentWeekStart: string): Promise<PastAlbum[]> {
  return exec<PastAlbum>(
    `select date_trunc('week', r.date)::date::text as "weekStart",
            coalesce(sum(r.points), 0)::int as points,
            count(*) filter (where r.solved_at_clue = 1)::int as diamonds,
            count(*)::int as "daysPlayed"
     from play_results r
     where r.player_id = $1::uuid and r.date < $2::date
     group by date_trunc('week', r.date)
     order by 1 desc`,
    [playerId, currentWeekStart],
  );
}

export async function playerStreakDays(exec: Exec, playerId: string, today: string): Promise<StreakDay[]> {
  return exec<StreakDay>(
    `select d.date::text as date, (p.player_id is not null) as started, (p.finished_at is not null) as finished
     from daily_puzzles d
     left join plays p on p.puzzle_number = d.number and p.player_id = $1::uuid
     where d.date <= $2::date
     order by d.date`,
    [playerId, today],
  );
}
