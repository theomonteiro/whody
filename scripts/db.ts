import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"], quiet: true });

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL não definida. Copie .env.example para .env.local e preencha.");
    process.exit(1);
  }
  return postgres(url, { prepare: false, max: 1, onnotice: () => {} });
}
