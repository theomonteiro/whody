// Aplica as migrations de supabase/migrations que ainda não rodaram neste banco.
// Uso: npm run db:migrate
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { connect } from "./db";

const dir = join(process.cwd(), "supabase", "migrations");

async function main() {
  const sql = connect();
  await sql`
    create table if not exists app_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
  await sql`alter table app_migrations enable row level security`;

  const applied = new Set((await sql<{ name: string }[]>`select name from app_migrations`).map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const body = readFileSync(join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into app_migrations (name) values (${file})`;
    });
    console.log(`aplicada: ${file}`);
  }
  console.log("migrations em dia.");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
