"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CLUE_COUNT, CLUE_SECONDS, pointsForClue, rarityForClue } from "@/lib/game/rules";
import type { GameState } from "@/lib/game/types";
import { GameHeader } from "./GameHeader";
import { StopwatchIcon } from "./icons";
import { Sticker } from "./Sticker";

/**
 * Tela de início: aparece enquanto a partida do dia não existe. Abrir esta tela não cria nada;
 * só o toque em "Começar" chama o servidor, que cria a partida e abre a pista 1.
 */
export function StartScreen({ state, onStart }: { state: GameState; onStart: (s: GameState) => void }) {
  const t = useTranslations();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function begin() {
    if (pending) return;
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleNumber: state.puzzle.number }),
      });
      if (res.status === 409) {
        window.location.reload();
        return;
      }
      const data = (await res.json()) as { state?: GameState };
      if (!res.ok || !data.state) throw new Error(String(res.status));
      onStart(data.state);
    } catch {
      setError(true);
      setPending(false);
    }
  }

  const rules = [t("start.rule1"), t("start.rule2", { seconds: CLUE_SECONDS }), t("start.rule3")];

  return (
    <>
      <GameHeader state={state} />
      <main className="flex flex-1 flex-col items-center px-5 pt-6 pb-8">
        <p className="font-hand text-[28px] leading-none text-stamp -rotate-2">{t("start.annotation")}</p>

        <Sticker rarity="diamond" tape className="mt-6 w-[150px] -rotate-3">
          <div
            role="img"
            aria-label={t("start.mystery")}
            className="flex aspect-[3/4] items-center justify-center rounded-lg bg-[#2b211b] font-display text-7xl text-[#f4ede0]"
          >
            ?
          </div>
        </Sticker>

        <h2 className="mt-6 text-center font-display text-[28px] leading-tight tracking-tight text-ink">
          {t("start.title", { points: pointsForClue(1) })}
        </h2>

        <h3 className="sr-only">{t("start.rulesTitle")}</h3>
        <ol className="mt-4 flex w-full flex-col gap-2 font-mono text-[15px] leading-snug text-ink">
          {rules.map((rule, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-bold text-stamp">{i + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>

        <ol aria-label={t("start.ladderLabel")} className="mt-5 flex w-full items-end justify-between">
          {Array.from({ length: CLUE_COUNT }, (_, i) => {
            const position = i + 1;
            const rarity = rarityForClue(position)!;
            const points = pointsForClue(position);
            return (
              <li
                key={position}
                aria-label={t("start.ladderItem", { position, rarity: t(`rarity.${rarity}`), points })}
                className="flex flex-col items-center gap-1.5"
                style={{ marginBottom: `${(CLUE_COUNT - position) * 3}px` }}
              >
                <span aria-hidden className={`frame frame-${rarity} block !rounded-[5px] !p-0 h-10 w-[30px]`} />
                <span aria-hidden className="font-mono text-sm font-bold text-ink-soft">
                  {points}
                </span>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={begin}
          disabled={pending}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-stamp font-display text-lg text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-80"
        >
          <StopwatchIcon />
          {pending ? t("start.starting") : t("start.begin")}
        </button>
        <p className="mt-3 text-center text-sm text-ink-soft">{t("start.hint")}</p>
        <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm font-medium text-stamp">
          {error ? t("start.error") : ""}
        </p>
      </main>
    </>
  );
}
