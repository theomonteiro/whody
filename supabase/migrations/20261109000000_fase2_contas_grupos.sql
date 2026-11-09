-- Whody, Fase 2: contas (Supabase Auth), grupos e rankings.
-- Só adiciona: duas colunas em players, índices e uma view. Nada é renomeado ou apagado.

-- Jogador anônimo que foi juntado a uma conta que já existia. As partidas dele passam pra conta;
-- as que perderam o desempate do mesmo dia ficam aqui, guardadas (nada é apagado).
alter table players add column merged_into uuid references players (id);
alter table players add column merged_at timestamptz;

create index players_merged_into_idx on players (merged_into) where merged_into is not null;
create index groups_created_by_idx on groups (created_by);

-- Resultado de cada partida, com o dia (já no fuso de Brasília: daily_puzzles.date é a data de lá)
-- e o tempo de resposta. Partida sem fim (o jogador saiu) conta como as 6 pistas esgotadas: 0 pontos
-- e 150 s. As consultas de ranking só contam partida terminada ou de dia que já passou.
create view play_results with (security_invoker = true) as
select
  p.player_id,
  d.number as puzzle_number,
  d.date,
  p.points,
  p.solved_at_clue,
  p.finished_at is not null as finished,
  case
    when p.finished_at is not null then (extract(epoch from (p.finished_at - p.started_at)) * 1000)::bigint
    else 150000
  end as response_ms
from plays p
join daily_puzzles d on d.number = p.puzzle_number;

-- A Data API está desligada, mas por garantia os papéis públicos do Supabase não leem a view.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on play_results from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on play_results from authenticated';
  end if;
end
$$;
