import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { PLAYER_COOKIE, PLAYER_COOKIE_MAX_AGE, playerCookieOptions } from "./lib/player-cookie";
import { hasSessionCookie, supabaseConfig } from "./lib/supabase/config";

/**
 * Antes de qualquer página ou API:
 * 1. garante o id anônimo do jogador num cookie httpOnly;
 * 2. se houver sessão do Supabase, renova o token (o @supabase/ssr regrava os cookies).
 */
export async function proxy(request: NextRequest) {
  const newPlayerId = request.cookies.get(PLAYER_COOKIE)?.value ? null : crypto.randomUUID();
  if (newPlayerId) request.cookies.set(PLAYER_COOKIE, newPlayerId);

  let response = NextResponse.next({ request });

  const config = supabaseConfig();
  if (config && hasSessionCookie(request.cookies.getAll().map((c) => c.name))) {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    });
    await supabase.auth.getClaims();
  }

  if (newPlayerId) response.cookies.set(PLAYER_COOKIE, newPlayerId, { ...playerCookieOptions(), maxAge: PLAYER_COOKIE_MAX_AGE });
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon|og/|portraits/|.*\.(?:png|jpg|svg|webp|ico|txt)$).*)"],
};
