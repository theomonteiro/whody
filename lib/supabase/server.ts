import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

/** Cliente do Supabase Auth no servidor, com a sessão nos cookies (fluxo PKCE). null sem configuração. */
export async function supabaseServer() {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Em Server Component não dá pra gravar cookie; o proxy renova a sessão.
        }
      },
    },
  });
}

export type AuthUser = { id: string; meta: Record<string, unknown> };

/** Usuário logado, com o JWT conferido (getClaims valida a assinatura). */
export async function authUser(): Promise<AuthUser | null> {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, meta: (claims.user_metadata as Record<string, unknown> | undefined) ?? {} };
}
