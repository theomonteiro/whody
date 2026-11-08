"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CLUE_COUNT, CLUE_SECONDS, GRACE_MS, pointsForClue, rarityForClue, screenFor } from "@/lib/game/rules";
import type { GameState, GuessResponse } from "@/lib/game/types";
import { GameHeader } from "./GameHeader";
import { Result } from "./Result";
import { StartScreen } from "./StartScreen";
import { Sticker } from "./Sticker";

type Feedback =
  | { kind: "wrong"; guess: string; next: number }
  | { kind: "timeout"; next: number }
  | { kind: "repeated"; guess: string }
  | { kind: "empty" | "stale" | "error" };

/** Barra vermelha nos últimos segundos. */
const WARNING_MS = 5000;

export function Game({ initial }: { initial: GameState }) {
  const [state, setState] = useState(initial);
  const screen = screenFor(true, state.status === "not-started" ? null : { started: true, finished: state.status !== "playing" });

  if (screen === "start") return <StartScreen state={state} onStart={setState} />;
  if (screen === "result") return <Result state={state} />;
  return <Board state={state} onState={setState} />;
}

/**
 * Tempo restante da pista, pelo relógio do servidor. Fica null até montar no navegador
 * (o HTML do servidor mostra a barra cheia), e corrige a diferença entre os relógios.
 */
function useRemaining(deadline: number | null, serverNow: number): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);
  const skewRef = useRef<number | null>(null);

  useEffect(() => {
    skewRef.current = serverNow - Date.now();
  }, [serverNow]);

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => setRemaining(deadline - (Date.now() + (skewRef.current ?? 0)));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 200);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [deadline]);

  return deadline === null ? null : remaining;
}

function Board({ state, onState }: { state: GameState; onState: (s: GameState) => void }) {
  const t = useTranslations();
  const format = useFormatter();
  const [guess, setGuess] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const newestClueRef = useRef<HTMLLIElement>(null);
  const syncedFor = useRef<number | null>(null);

  const current = state.openClues;
  const rarity = rarityForClue(current)!;
  const rarityName = t(`rarity.${rarity}`);
  const remaining = useRemaining(state.clueDeadline, state.serverNow);
  const seconds = remaining === null ? CLUE_SECONDS : Math.max(0, Math.ceil(remaining / 1000));
  const fraction = remaining === null ? 1 : Math.min(1, Math.max(0, remaining / (CLUE_SECONDS * 1000)));
  const warning = remaining !== null && remaining <= WARNING_MS;

  function showNewClue() {
    requestAnimationFrame(() => newestClueRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  // Quando o prazo + tolerância passa, pede ao servidor o estado com a próxima pista aberta.
  // O texto do campo fica onde está.
  const deadline = state.clueDeadline;
  const expired = remaining !== null && remaining < -(GRACE_MS + 250);
  useEffect(() => {
    if (!expired || pending || deadline === null || syncedFor.current === deadline) return;
    syncedFor.current = deadline;
    fetch("/api/play", { cache: "no-store" })
      .then((res) => res.json() as Promise<{ state?: GameState }>)
      .then(({ state: next }) => {
        if (!next) return;
        if (next.status === "playing" && next.openClues > current) {
          setFeedback({ kind: "timeout", next: next.openClues });
          showNewClue();
        }
        onState(next);
      })
      .catch(() => {
        syncedFor.current = null;
      });
  }, [expired, pending, deadline, current, onState]);

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
      if (data.outcome === "stale" || data.outcome === "not-started") {
        setFeedback({ kind: "stale" });
        window.location.reload();
        return;
      }
      if (!res.ok || !data.state) throw new Error(String(res.status));

      const sent = guess.trim();
      if (data.outcome === "wrong") {
        setFeedback({ kind: "wrong", guess: sent, next: data.state.openClues });
        setGuess("");
        showNewClue();
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
      case "timeout":
        return t("game.timeout", { next: feedback.next });
      case "repeated":
        return t("game.repeated", { guess: feedback.guess });
      default:
        return t(`game.${feedback.kind}`);
    }
  })();

  return (
    <>
      <GameHeader state={state} />

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

        <div className="mt-5 flex items-center gap-3">
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-beige"
            role="progressbar"
            aria-label={t("game.timeLeftLabel")}
            aria-valuemin={0}
            aria-valuemax={CLUE_SECONDS}
            aria-valuenow={seconds}
            aria-valuetext={t("game.timeLeft", { seconds })}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-200 ease-linear ${warning ? "bg-stamp" : "bg-ink"}`}
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
          <span
            aria-hidden
            className={`w-9 text-right font-mono text-base font-bold tabular-nums ${warning ? "text-stamp" : "text-ink"}`}
          >
            {t("game.secondsShort", { seconds })}
          </span>
        </div>

        <h2 className="sr-only">{t("game.cluesTitle")}</h2>
        <ol className="mt-6 flex flex-col gap-2.5">
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
