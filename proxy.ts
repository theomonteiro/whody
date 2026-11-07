import { NextResponse, type NextRequest } from "next/server";
import { PLAYER_COOKIE, PLAYER_COOKIE_MAX_AGE } from "./lib/player-cookie";

/** Garante o id anônimo do jogador num cookie httpOnly antes de qualquer página ou API. */
export function proxy(request: NextRequest) {
  if (request.cookies.get(PLAYER_COOKIE)?.value) return NextResponse.next();

  const id = crypto.randomUUID();
  request.cookies.set(PLAYER_COOKIE, id);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(PLAYER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PLAYER_COOKIE_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon|og/|.*\\.(?:png|jpg|svg|webp|ico|txt)$).*)"],
};
