import { NextResponse } from "next/server";
import { startPlay } from "@/lib/game/service";
import { currentPlayerId } from "@/lib/player";

export const dynamic = "force-dynamic";

/** Registra que o jogador abriu a pista 1 (início do cronômetro do dia). */
export async function POST(request: Request) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "no-player" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const puzzleNumber = (body as { puzzleNumber?: unknown } | null)?.puzzleNumber;
  if (typeof puzzleNumber !== "number" || !Number.isInteger(puzzleNumber)) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const ok = await startPlay(playerId, puzzleNumber);
  return NextResponse.json({ ok }, { status: ok ? 200 : 409, headers: { "Cache-Control": "no-store" } });
}
