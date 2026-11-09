// Supabase só pro login (Auth). O jogo e os grupos usam a DATABASE_URL; a Data API fica desligada.

export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

/** Cookies de sessão do @supabase/ssr ("sb-<ref>-auth-token", às vezes em pedaços .0, .1…). */
export function hasSessionCookie(names: Iterable<string>): boolean {
  for (const name of names) if (name.startsWith("sb-") && name.includes("-auth-token")) return true;
  return false;
}

/** Só aceita destino interno ("/grupos", não "//outro.site" nem "https://…"). */
export function safeNext(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}
