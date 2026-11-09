import { NextResponse, type NextRequest } from "next/server";
import { PLAYER_COOKIE, playerCookieOptions } from "@/lib/player-cookie";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Sai da conta e troca o cookie: este aparelho volta a jogar como um anônimo novo. */
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase?.auth.signOut();
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
  response.cookies.set(PLAYER_COOKIE, crypto.randomUUID(), playerCookieOptions());
  return response;
}
