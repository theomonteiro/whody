import { NextResponse } from "next/server";
import { submitGuess } from "@/lib/game/service";
import type { GuessResponse } from "@/lib/game/types";
import { currentPlayerId } from "@/lib/player";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "no-player" }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  const { puzzleNumber, guess } = (body ?? {}) as { puzzleNumber?: unknown; guess?: unknown };
  if (typeof puzzleNumber !== "number" || !Number.isInteger(puzzleNumber) || typeof guess !== "string") {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const result: GuessResponse = await submitGuess(playerId, puzzleNumber, guess);
  const status = result.outcome === "stale" || result.outcome === "not-started" ? 409 : 200;
  return NextResponse.json(result, { status, headers: { "Cache-Control": "no-store" } });
}
