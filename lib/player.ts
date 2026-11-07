import "server-only";
import { cookies } from "next/headers";
import { PLAYER_COOKIE } from "./player-cookie";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPlayerId(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}

/** Id anônimo do jogador (cookie httpOnly criado em proxy.ts). */
export async function currentPlayerId(): Promise<string | null> {
  const value = (await cookies()).get(PLAYER_COOKIE)?.value;
  return isPlayerId(value) ? value : null;
}
