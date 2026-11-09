import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { accountPlayer, anonymousUsable, linkAccount } from "./account/link";
import { appDb } from "./app-db";
import { PLAYER_COOKIE } from "./player-cookie";
import { authUser } from "./supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPlayerId(value: string | undefined): value is string {
  return !!value && UUID.test(value);
}

export type Viewer = {
  /** Jogador que joga agora: o da conta (logado) ou o anônimo do cookie. null = precisa de cookie novo. */
  playerId: string | null;
  account: { authUserId: string; name: string | null; meta: Record<string, unknown> } | null;
};

async function cookiePlayerId(): Promise<string | null> {
  const value = (await cookies()).get(PLAYER_COOKIE)?.value;
  return isPlayerId(value) ? value : null;
}

/**
 * Quem está jogando, uma vez por requisição.
 * - Logado: o jogador da conta (se ainda não estiver ligado, liga agora com o cookie).
 * - Deslogado: o id do cookie, se ele não pertencer a uma conta (depois de sair, o cookie é trocado;
 *   se a sessão expirar sem sair, o próximo "Começar" ganha um cookie novo).
 */
export const getViewer = cache(async (): Promise<Viewer> => {
  const [user, cookieId] = await Promise.all([authUser(), cookiePlayerId()]);
  const db = appDb();
  if (user) {
    let player = await accountPlayer(db.exec, user.id);
    if (!player) player = { id: await linkAccount(db, cookieId, user.id), name: null };
    return { playerId: player.id, account: { authUserId: user.id, name: player.name, meta: user.meta } };
  }
  if (!cookieId) return { playerId: null, account: null };
  return { playerId: (await anonymousUsable(db.exec, cookieId)) ? cookieId : null, account: null };
});

/** Id do jogador atual (conta ou anônimo). */
export async function currentPlayerId(): Promise<string | null> {
  return (await getViewer()).playerId;
}
