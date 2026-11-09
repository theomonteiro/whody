"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { GameState } from "@/lib/game/types";
import { dateFromIso } from "@/lib/site";
import { BookIcon, ChartIcon, FlameIcon } from "./icons";
import Link from "next/link";
import { HeaderLink, LeatherHeader } from "./LeatherHeader";

/** Cabeçalho de couro do dia: logo, nº e data, streak (abre o perfil), álbum e grupos. */
export function GameHeader({ state }: { state: GameState }) {
  const t = useTranslations();
  const format = useFormatter();
  return (
    <LeatherHeader>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[34px] leading-none tracking-tight text-gold">{t("brand.logo")}</h1>
        <p className="mt-1.5 font-mono text-[13px] leading-tight font-bold text-gold">
          {t("header.dayAndDate", {
            number: state.puzzle.number,
            date: format.dateTime(dateFromIso(state.puzzle.date), { weekday: "short", day: "numeric", month: "short" }),
          })}
        </p>
      </div>
      <StreakPill count={state.stats.streak} />
      <HeaderLink href="/album" label={t("header.album")}>
        <BookIcon />
      </HeaderLink>
      <HeaderLink href="/grupos" label={t("header.group")}>
        <ChartIcon />
      </HeaderLink>
    </LeatherHeader>
  );
}

function StreakPill({ count }: { count: number }) {
  const t = useTranslations("header");
  return (
    <Link
      href="/perfil"
      className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-black/25 px-3.5 font-display text-lg text-card transition hover:bg-black/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      aria-label={t("streakLink", { count })}
      title={t("streak", { count })}
    >
      <FlameIcon className="text-gold" />
      <span aria-hidden>{count}</span>
    </Link>
  );
}
