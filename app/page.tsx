import { getTranslations } from "next-intl/server";
import { Game } from "@/components/Game";
import { LeatherHeader } from "@/components/LeatherHeader";
import { getPuzzle, getState } from "@/lib/game/service";
import { currentPlayerId } from "@/lib/player";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const puzzle = await getPuzzle();
  if (!puzzle) return <NoPuzzle />;

  const playerId = await currentPlayerId();
  // O estado público só traz pistas abertas e só revela a pessoa depois do fim.
  const state = await getState(playerId, puzzle);
  return <Game key={puzzle.number} initial={state} />;
}

async function NoPuzzle() {
  const t = await getTranslations();
  return (
    <>
      <LeatherHeader>
        <p className="min-h-12 font-display text-[34px] leading-none tracking-tight text-gold">{t("brand.logo")}</p>
      </LeatherHeader>
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <p className="font-hand text-3xl text-stamp -rotate-2">{t("noPuzzle.annotation")}</p>
        <h1 className="mt-2 font-display text-4xl text-ink">{t("noPuzzle.title")}</h1>
        <p className="mt-3 max-w-xs text-ink-soft">{t("noPuzzle.body")}</p>
      </main>
    </>
  );
}
