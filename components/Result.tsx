"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { rarityForClue } from "@/lib/game/rules";
import type { GameState } from "@/lib/game/types";
import { Countdown } from "./Countdown";
import { LeatherHeader } from "./LeatherHeader";
import { Portrait } from "./Portrait";
import { ShareCard } from "./ShareCard";
import { Sticker } from "./Sticker";

export function Result({ state }: { state: GameState }) {
  const t = useTranslations();
  const format = useFormatter();
  const reveal = state.reveal!;
  const rarity = rarityForClue(state.solvedAtClue);
  const rarityName = t(rarity ? `rarity.${rarity}` : "rarity.empty");

  return (
    <>
      <LeatherHeader>
        <Link
          href="/"
          aria-label={t("brand.home")}
          className="inline-flex min-h-12 items-center font-display text-[30px] leading-none tracking-tight text-gold"
        >
          {t("brand.logo")}
        </Link>
        <p className="ml-auto font-mono text-sm font-bold text-gold">
          {t.rich("header.nextIn", { time: () => <Countdown target={state.nextPuzzleAt} /> })}
        </p>
      </LeatherHeader>

      <main className="flex flex-1 flex-col px-5 pt-7 pb-10">
        <header className="text-center">
          <p className="font-hand text-[28px] leading-none text-stamp -rotate-2">
            {rarity
              ? t("result.solvedAnnotation", { clue: state.solvedAtClue! })
              : t("result.failedAnnotation")}
          </p>
          <h1 className="mt-1 font-display text-5xl tracking-tight text-ink">{rarityName}</h1>
        </header>

        <Sticker rarity={rarity} tape className="reveal-in mx-auto mt-9 w-[260px] -rotate-2">
          <div className="rounded-[10px] bg-card p-3">
            <div className="flex items-baseline justify-between font-mono text-[13px] font-bold text-ink">
              <span>{t("result.stickerTop", { number: state.puzzle.number })}</span>
              <span className="lowercase">{t("result.stickerRarity", { rarity: rarityName, points: state.points })}</span>
            </div>
            <Portrait
              url={reveal.portraitUrl}
              rarity={rarity}
              alt={t("result.portraitAlt", { name: reveal.displayName })}
              className="mt-2"
            />
            <p className="mt-2.5 font-display text-2xl leading-tight text-ink">{reveal.displayName}</p>
            <p className="text-sm text-ink-soft">
              {t("result.bioAndYears", { bio: reveal.shortBio, years: reveal.years })}
            </p>
          </div>
        </Sticker>

        <dl className="mt-9 grid grid-cols-3 divide-x divide-line text-center">
          <div className="flex flex-col">
            <dt className="text-[15px] text-ink-soft">{t("result.pointsTodayLabel")}</dt>
            <dd className="-order-1 font-display text-3xl text-ink">+{format.number(state.points)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-[15px] text-ink-soft">{t("result.weekLabel")}</dt>
            <dd className="-order-1 font-display text-3xl text-ink">{format.number(state.stats.weekPoints)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-[15px] text-ink-soft">{t("result.streakLabel", { count: state.stats.streak })}</dt>
            <dd className="-order-1 font-display text-3xl text-ink">{format.number(state.stats.streak)}</dd>
          </div>
        </dl>

        <div className="mt-8">
          <ShareCard state={state} />
        </div>

        <Link
          href="/album"
          className="mt-8 flex h-14 items-center justify-center rounded-2xl border-[1.5px] border-ink bg-card font-display text-lg text-ink transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
        >
          {t("result.albumButton")}
        </Link>

        <details className="group mt-4">
          <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center font-medium text-ink underline underline-offset-4">
            {t("result.learnMore", { name: reveal.displayName })}
          </summary>
          <ol className="mt-3 flex flex-col gap-2.5">
            {reveal.sources.map((s) => (
              <li key={s.position} className="clue-card flex gap-3 px-4 py-3 font-mono text-[15px] leading-snug">
                <span className="font-bold text-stamp" aria-label={t("result.clueLabel", { position: s.position })}>
                  {s.position}
                </span>
                <div>
                  <p className="text-ink">{s.text}</p>
                  {s.urls.length > 0 ? (
                    <p className="mt-1 flex flex-wrap gap-x-4">
                      {s.urls.map((url, i) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center text-sm font-bold text-stamp underline underline-offset-2"
                        >
                          {t("result.clueSource", { n: i + 1, count: s.urls.length })}
                        </a>
                      ))}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-ink-soft">{t("result.clueSourceMissing")}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </details>
      </main>
    </>
  );
}
