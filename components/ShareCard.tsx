"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { rarityForClue, SHARE_EMOJI, shareSquares, type ShareSquare } from "@/lib/game/rules";
import type { GameState } from "@/lib/game/types";

const SQUARE_CLASS: Record<ShareSquare, string> = {
  miss: "bg-stamp",
  hit: "bg-hit",
  timeout: "bg-ink",
  unopened: "bg-beige",
};

const SQUARE_LABEL: Record<ShareSquare, string> = {
  miss: "share.squareMiss",
  hit: "share.squareHit",
  timeout: "share.squareTimeout",
  unopened: "share.squareUnopened",
};

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/** Card de compartilhar: número do dia, quadradinhos, pontos e raridade. Nunca o nome da pessoa. */
export function ShareCard({ state }: { state: GameState }) {
  const t = useTranslations();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const squares = shareSquares(state.attempts);
  const rarity = rarityForClue(state.solvedAtClue);
  const rarityName = t(rarity ? `rarity.${rarity}` : "rarity.empty");
  const path = `/s/${state.puzzle.number}/${rarity ?? "empty"}`;
  const pathLabel = squares.map((s) => t(SQUARE_LABEL[s])).join(", ");

  async function onShare() {
    const text = t("share.text", {
      number: state.puzzle.number,
      squares: squares.map((s) => SHARE_EMOJI[s]).join(""),
      points: state.points,
      rarity: rarityName,
      url: `${window.location.origin}${path}`,
    });
    setStatus((await copy(text)) ? "copied" : "failed");
    setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <section aria-label={t("share.title")} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-4">
      <div className="min-w-0 flex-1 font-mono">
        <p className="font-bold text-ink">{t("share.heading", { number: state.puzzle.number })}</p>
        <div role="img" aria-label={t("share.squaresLabel", { path: pathLabel })} className="my-2 flex gap-1.5">
          {squares.map((s, i) => (
            <span key={i} className={`size-5 rounded-[4px] ${SQUARE_CLASS[s]}`} />
          ))}
        </div>
        <p className="text-[15px] font-bold whitespace-nowrap text-ink">{t("share.summary", { points: state.points, rarity: rarityName })}</p>
      </div>
      <button
        type="button"
        onClick={onShare}
        className="h-14 shrink-0 rounded-2xl bg-stamp px-5 font-display text-[17px] text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span aria-live="polite">
          {status === "copied" ? t("share.copied") : status === "failed" ? t("share.copyFailed") : t("share.button")}
        </span>
      </button>
    </section>
  );
}
