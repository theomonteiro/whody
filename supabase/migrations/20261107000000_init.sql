-- Whody, Fase 1: conteúdo, jogadas e (já prontas pra Fase 2) grupos.
-- O app acessa o banco só pelo servidor, com a connection string do Postgres.
-- RLS fica ligado sem políticas: a API REST do Supabase (chave anon) não enxerga nada.

create table people (
  id             text primary key,            -- slug, ex.: 'santos-dumont'
  display_name   text not null,
  accepted_names text[] not null check (cardinality(accepted_names) > 0),
  short_bio      text not null,
  years          text not null,
  portrait_url   text,
  locale         text not null default 'pt-BR'
);

create table clues (
  id         bigint generated always as identity primary key,
  person_id  text not null references people (id) on delete cascade,
  position   smallint not null check (position between 1 and 6),
  text       text not null,
  source_url text,
  locale     text not null default 'pt-BR',
  unique (person_id, locale, position)
);

create table daily_puzzles (
  number    integer primary key,
  date      date not null unique,
  person_id text not null references people (id)
);

create table players (
  id           uuid primary key,              -- o mesmo id do cookie anônimo
  name         text,
  avatar       text,
  auth_user_id uuid unique,                   -- vazio na Fase 1
  created_at   timestamptz not null default now()
);

create table plays (
  id             bigint generated always as identity primary key,
  player_id      uuid not null references players (id) on delete cascade,
  puzzle_number  integer not null references daily_puzzles (number),
  attempts       jsonb not null default '[]'::jsonb,
  solved_at_clue smallint check (solved_at_clue between 1 and 6),
  points         smallint not null default 0 check (points between 0 and 100),
  started_at     timestamptz not null default now(),
  finished_at    timestamptz,
  unique (player_id, puzzle_number)
);

create index plays_puzzle_idx on plays (puzzle_number);

create table groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text not null unique,
  created_by  uuid not null references players (id),
  created_at  timestamptz not null default now()
);

create table group_members (
  group_id  uuid not null references groups (id) on delete cascade,
  player_id uuid not null references players (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, player_id)
);

create index group_members_player_idx on group_members (player_id);

alter table people        enable row level security;
alter table clues         enable row level security;
alter table daily_puzzles enable row level security;
alter table players       enable row level security;
alter table plays         enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;
