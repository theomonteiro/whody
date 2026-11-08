import { NextResponse } from "next/server";
import { getPuzzle, getState, startPlay } from "@/lib/game/service";
import { currentPlayerId } from "@/lib/player";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

/** Estado atual do dia, com os tempos esgotados aplicados (o cliente chama quando a pista vence). */
export async function GET() {
  const puzzle = await getPuzzle();
  if (!puzzle) return NextResponse.json({ error: "no-puzzle" }, { status: 404, headers: noStore });
  const state = await getState(await currentPlayerId(), puzzle);
  return NextResponse.json({ state }, { headers: noStore });
}

/** "Começar": cria a partida do dia e abre a pista 1. Idempotente. */
export async function POST(request: Request) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "no-player" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const puzzleNumber = (body as { puzzleNumber?: unknown } | null)?.puzzleNumber;
  if (typeof puzzleNumber !== "number" || !Number.isInteger(puzzleNumber)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const state = await startPlay(playerId, puzzleNumber);
  if (!state) return NextResponse.json({ error: "stale" }, { status: 409, headers: noStore });
  return NextResponse.json({ state }, { headers: noStore });
}
