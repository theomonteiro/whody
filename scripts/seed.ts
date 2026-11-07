// Copia content/people.ts pro banco: pessoas, pistas e agenda.
// Uso: npm run db:seed (pode rodar quantas vezes quiser; é idempotente).
import { hasTodo, people, schedule } from "../content/people";
import { normalize } from "../lib/game/judge";
import { gameDate, puzzleNumberFor, PUZZLE_EPOCH } from "../lib/time";
import { connect } from "./db";

function validate(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const owners = new Map<string, string>();
  for (const p of people) {
    if (ids.has(p.id)) errors.push(`id repetido: ${p.id}`);
    ids.add(p.id);
    if (p.clues.length !== 6) errors.push(`${p.id}: precisa de 6 pistas`);
    if (p.acceptedNames.length === 0) errors.push(`${p.id}: sem nomes aceitos`);
    for (const name of p.acceptedNames) {
      const n = normalize(name);
      if (!n) errors.push(`${p.id}: nome aceito vazio`);
      const owner = owners.get(n);
      if (owner && owner !== p.id) {
        console.warn(`aviso: "${n}" é nome aceito de ${owner} e ${p.id}; nenhum dos dois acerta com ele.`);
      }
      owners.set(n, p.id);
    }
  }
  const dates = new Set<string>();
  for (const s of schedule) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) errors.push(`data inválida: ${s.date}`);
    if (s.date < PUZZLE_EPOCH) errors.push(`${s.date} é anterior à estreia (${PUZZLE_EPOCH})`);
    if (dates.has(s.date)) errors.push(`data repetida na agenda: ${s.date}`);
    dates.add(s.date);
    if (!ids.has(s.personId)) errors.push(`${s.date}: pessoa inexistente ${s.personId}`);
  }
  return errors;
}

async function main() {
  const errors = validate();
  if (errors.length) {
    console.error(errors.map((e) => `erro: ${e}`).join("\n"));
    process.exit(1);
  }

  const sql = connect();
  const byId = new Map(people.map((p) => [p.id, p]));

  await sql.begin(async (tx) => {
    for (const p of people) {
      await tx`
        insert into people (id, display_name, accepted_names, short_bio, years, portrait_url, locale)
        values (${p.id}, ${p.displayName}, ${p.acceptedNames}, ${p.shortBio}, ${p.years}, ${p.portraitUrl}, ${p.locale})
        on conflict (id) do update set
          display_name = excluded.display_name,
          accepted_names = excluded.accepted_names,
          short_bio = excluded.short_bio,
          years = excluded.years,
          portrait_url = excluded.portrait_url,
          locale = excluded.locale`;
      await tx`delete from clues where person_id = ${p.id} and locale = ${p.locale}`;
      for (const [i, c] of p.clues.entries()) {
        await tx`
          insert into clues (person_id, position, text, source_url, locale)
          values (${p.id}, ${i + 1}, ${c.text}, ${c.sourceUrl}, ${p.locale})`;
      }
    }

    const today = gameDate();
    const scheduled: number[] = [];
    for (const s of schedule) {
      const person = byId.get(s.personId)!;
      if (hasTodo(person)) {
        console.warn(`pulando ${s.date} (${person.displayName}): conteúdo com TODO.`);
        continue;
      }
      const number = puzzleNumberFor(s.date);
      const [existing] = await tx<{ person_id: string; plays: number }[]>`
        select d.person_id, (select count(*)::int from plays where puzzle_number = d.number) as plays
        from daily_puzzles d where d.number = ${number}`;
      if (existing && existing.person_id !== s.personId && existing.plays > 0) {
        console.warn(`#${number} (${s.date}) já tem jogadas; mantendo ${existing.person_id}.`);
        scheduled.push(number);
        continue;
      }
      await tx`
        insert into daily_puzzles (number, date, person_id)
        values (${number}, ${s.date}, ${s.personId})
        on conflict (number) do update set date = excluded.date, person_id = excluded.person_id`;
      scheduled.push(number);
    }

    // Tira da agenda os dias futuros que saíram do arquivo (e ainda não têm jogadas).
    await tx`
      delete from daily_puzzles d
      where d.date >= ${today}
        and not (d.number = any(${scheduled}::int[]))
        and not exists (select 1 from plays where puzzle_number = d.number)`;

    console.log(`${people.length} pessoas, ${scheduled.length} dias agendados.`);
  });

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
