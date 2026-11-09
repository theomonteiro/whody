// Constantes do cookie do jogador, sem dependências de servidor (usadas também em proxy.ts).
export const PLAYER_COOKIE = "whody_pid";
export const PLAYER_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

export function playerCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PLAYER_COOKIE_MAX_AGE,
  };
}
