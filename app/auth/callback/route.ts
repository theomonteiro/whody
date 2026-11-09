import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { accountPlayer, linkAccount } from "@/lib/account/link";
import { appDb } from "@/lib/app-db";
import { isPlayerId } from "@/lib/player";
import { PLAYER_COOKIE } from "@/lib/player-cookie";
import { safeNext } from "@/lib/supabase/config";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Volta do Google: troca o código pela sessão e liga o jogador anônimo do cookie à conta
 * (partidas, streak e álbuns passam pra conta). No primeiro login, pede o nome.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");
  const fail = NextResponse.redirect(new URL(`/entrar?erro=1&next=${encodeURIComponent(next)}`, origin));

  const supabase = await supabaseServer();
  if (!supabase || !code) return fail;
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fail;

  const cookieId = (await cookies()).get(PLAYER_COOKIE)?.value;
  const db = appDb();
  await linkAccount(db, isPlayerId(cookieId) ? cookieId : null, data.user.id);
  const player = await accountPlayer(db.exec, data.user.id);

  const target = player?.name ? next : `/bem-vindo?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(target, origin));
}
