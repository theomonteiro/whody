import "server-only";
import { appDb } from "@/lib/app-db";
import { getPuzzle } from "@/lib/game/service";
import { gameDate } from "@/lib/time";
import { groupBoard, myGroups } from "./queries";

/** Tela do grupo pro jogador. null se ele não é membro (ou o grupo não existe). */
export async function getGroupScreen(playerId: string, groupId: string) {
  const today = gameDate();
  const [board, puzzle] = await Promise.all([groupBoard(appDb().exec, playerId, groupId, today), getPuzzle(today)]);
  if (!board) return null;
  // Só o número do dia: a pessoa nunca entra na tela do grupo.
  return { board, todayNumber: puzzle?.number ?? null };
}

export async function getMyGroups(playerId: string) {
  return myGroups(appDb().exec, playerId);
}
