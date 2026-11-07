"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CLUE_COUNT, pointsForClue, rarityForClue } from "@/lib/game/rules";
import type { GameState, GuessResponse } from "@/lib/game/types";
import { dateFromIso } from "@/lib/site";
import { ChartIcon, BookIcon, FlameIcon } from "./icons";
import { HeaderDisabledButton, HeaderLink, LeatherHeader } from "./LeatherHeader";
import { Result } from "./Result";
import { Sticker } from "./Sticker";

type Feedback =
  | { kind: "wrong"; guess: string; next: number }
  | { kind: "repeated"; guess: string }
  | { kind: "empty" | "stale" | "error" };

export function Game({ initial }: { initial: GameState }) {
  const [state, setState] = useState(initial);
  const playing = state.status === "playing";

  // Marca o início do dia no servidor (a pista 1 abriu). Idempotente.
  const puzzleNumber = state.puzzle.number;
  const started = initial.attempts.length > 0 || initial.status !== "playing";
  useEffect(() => {
    if (started) return;
    fetch("/api/play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleNumber }),
    }).catch(() => {});
  }, [started, puzzleNumber]);

  if (!playing) return <Result state={state} />;
  return <Board state={state} onState={setState} />;
}

function Board({ state, onState }: { state: GameState; onState: (s: GameState) => void }) {
  const t = useTranslations();
  const format = useFormatter();
  const [guess, setGuess] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newestClueRef = useRef<HTMLLIElement>(null);

  const current = state.openClues;
  const rarity = rarityForClue(current)!;
  const rarityName = t(`rarity.${rarity}`);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!guess.trim()) {
      setFeedback({ kind: "empty" });
      inputRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleNumber: state.puzzle.number, guess }),
      });
      const data = (await res.json()) as GuessResponse;
      if (data.outcome === "stale") {
        setFeedback({ kind: "stale" });
        window.location.reload();
        return;
      }
      if (!res.ok || !data.state) throw new Error(String(res.status));

      const sent = guess.trim();
      if (data.outcome === "wrong") {
        setFeedback({ kind: "wrong", guess: sent, next: data.state.openClues });
        setGuess("");
        requestAnimationFrame(() => newestClueRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
      } else if (data.outcome === "repeated") {
        setFeedback({ kind: "repeated", guess: sent });
      } else if (data.outcome === "empty") {
        setFeedback({ kind: "empty" });
      } else {
        setFeedback(null);
      }
      onState(data.state);
    } catch {
      setFeedback({ kind: "error" });
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  const feedbackText = (() => {
    if (!feedback) return "";
    switch (feedback.kind) {
      case "wrong":
        return t("game.wrong", { guess: feedback.guess, next: feedback.next });
      case "repeated":
        return t("game.repeated", { guess: feedback.guess });
      default:
        return t(`game.${feedback.kind}`);
    }
  })();

  return (
    <>
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
        <HeaderDisabledButton label={t("header.group")}>
          <ChartIcon />
        </HeaderDisabledButton>
      </LeatherHeader>

      <main className="flex-1 px-5 pt-7 pb-6">
        <section className="flex items-center gap-5">
          <Sticker rarity={rarity} tape className="w-[104px] shrink-0 -rotate-3">
            <div
              role="img"
              aria-label={t("game.mystery", { rarity: rarityName })}
              className="flex aspect-[3/4] items-center justify-center rounded-lg bg-[#2b211b] font-display text-5xl text-[#f4ede0]"
            >
              ?
            </div>
          </Sticker>
          <div className="min-w-0 flex-1">
            <p className="font-hand text-2xl leading-none text-stamp -rotate-2">{t("game.annotation")}</p>
            <p className="mt-2 font-display text-[44px] leading-none text-ink">
              {format.number(pointsForClue(current))}
              <span className="ml-1.5 font-sans text-lg font-semibold text-ink-soft">
                {t("game.currentSuffix", { rarity: rarityName })}
              </span>
            </p>
            <div
              className="mt-3 flex gap-1.5"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={CLUE_COUNT}
              aria-valuenow={current}
              aria-label={t("game.progressLabel", { current, total: CLUE_COUNT })}
            >
              {Array.from({ length: CLUE_COUNT }, (_, i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-ink" : "bg-beige"}`} />
              ))}
            </div>
            <p className="mt-2 text-sm text-ink-soft">{t("game.progress", { current, total: CLUE_COUNT })}</p>
          </div>
        </section>

        <h2 className="sr-only">{t("game.cluesTitle")}</h2>
        <ol className="mt-7 flex flex-col gap-2.5">
          {state.clues.map((clue) =>
            clue.open ? (
              <li
                key={clue.position}
                ref={clue.position === current ? newestClueRef : undefined}
                aria-label={t("game.openClueLabel", { position: clue.position })}
                className="clue-card reveal-in flex gap-3 px-4 py-3.5 font-mono text-[17px] leading-snug"
              >
                <span className="font-bold text-stamp">{clue.position}</span>
                <p className="text-ink">{clue.text}</p>
              </li>
            ) : (
              <li
                key={clue.position}
                aria-label={t("game.closedClueLabel", { position: clue.position, value: clue.value })}
                className="clue-closed flex items-center gap-3 px-4 py-2.5 font-mono text-[15px] text-ink-soft"
              >
                <span aria-hidden className="font-bold">
                  {clue.position}
                </span>
                <span aria-hidden className="flex-1">
                  {t("game.closedClue")}
                </span>
                <span aria-hidden className="font-bold">
                  {t("game.points", { value: clue.value })}
                </span>
              </li>
            ),
          )}
        </ol>
      </main>

      <form
        onSubmit={submit}
        className="sticky bottom-0 border-t border-line bg-paper/95 px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] backdrop-blur"
      >
        <p aria-live="polite" role="status" className="min-h-6 pb-2 text-sm font-medium text-stamp">
          {feedbackText}
        </p>
        <div className="flex gap-3">
          <label htmlFor="guess" className="sr-only">
            {t("game.guessLabel")}
          </label>
          <input
            ref={inputRef}
            id="guess"
            name="guess"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={t("game.guessPlaceholder")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="send"
            maxLength={80}
            className="h-14 min-w-0 flex-1 rounded-2xl border-[1.5px] border-ink bg-card px-4 font-mono text-lg text-ink placeholder:font-bold placeholder:text-ink-soft focus:outline-2 focus:outline-offset-2 focus:outline-stamp"
          />
          <button
            type="submit"
            disabled={pending}
            className="h-14 shrink-0 rounded-2xl bg-stamp px-7 font-display text-lg text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-80"
          >
            {pending ? t("game.sending") : t("game.submit")}
          </button>
        </div>
      </form>
    </>
  );
}

export function StreakPill({ count }: { count: number }) {
  const t = useTranslations("header");
  return (
    <p
      className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-black/25 px-3.5 font-display text-lg text-card"
      aria-label={t("streak", { count })}
      title={t("streak", { count })}
    >
      <FlameIcon className="text-gold" />
      <span aria-hidden>{count}</span>
    </p>
  );
}
