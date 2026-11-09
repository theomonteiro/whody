import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Começa o login com o Google (PKCE): o Supabase devolve em /auth/callback. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const supabase = await supabaseServer();
  if (!supabase) return NextResponse.redirect(new URL(`/entrar?erro=config&next=${encodeURIComponent(next)}`, origin));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) return NextResponse.redirect(new URL(`/entrar?erro=1&next=${encodeURIComponent(next)}`, origin));
  return NextResponse.redirect(data.url);
}
