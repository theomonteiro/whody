// Regras do jogo compartilhadas entre servidor e cliente (sem conteúdo secreto).

export const CLUE_COUNT = 6;
/** Segundos por pista. Mude aqui pra ajustar o jogo inteiro (servidor, barra e tela de início). */
export const CLUE_SECONDS = 25;
/** Tolerância de latência: um palpite até esse tanto depois do prazo ainda vale pra pista. */
export const GRACE_MS = 1500;
export const POINTS_BY_CLUE = [100, 80, 60, 40, 20, 5] as const;
export const WEEK_MAX_POINTS = 700;

export const RARITIES = ["diamond", "platinum", "gold", "silver", "bronze", "common"] as const;
export type Rarity = (typeof RARITIES)[number];

/** Pontos de acertar na pista `position` (1–6). */
export function pointsForClue(position: number): number {
  return POINTS_BY_CLUE[position - 1] ?? 0;
}

/** Figurinha pela pista do acerto (1–6); null = espaço vazio. */
export function rarityForClue(position: number | null): Rarity | null {
  if (position === null) return null;
  return RARITIES[position - 1] ?? null;
}

/** Faixas do álbum semanal, da maior pra menor. */
const ALBUM_TIERS: { rarity: Rarity; min: number }[] = [
  { rarity: "diamond", min: 601 },
  { rarity: "platinum", min: 501 },
  { rarity: "gold", min: 401 },
  { rarity: "silver", min: 301 },
  { rarity: "bronze", min: 201 },
  { rarity: "common", min: 0 },
];

export type AlbumRarity = { rarity: Rarity; star: boolean };

export function albumRarity(weekPoints: number): AlbumRarity {
  const tier = ALBUM_TIERS.find((t) => weekPoints >= t.min) ?? ALBUM_TIERS[ALBUM_TIERS.length - 1];
  return { rarity: tier.rarity, star: weekPoints >= WEEK_MAX_POINTS };
}

/** Próximo degrau do álbum e quantos pontos faltam; null quando já é Diamante com estrela. */
export function nextAlbumGoal(
  weekPoints: number,
): { rarity: Rarity; star: boolean; missing: number } | null {
  if (weekPoints >= WEEK_MAX_POINTS) return null;
  if (weekPoints >= 601) {
    return { rarity: "diamond", star: true, missing: WEEK_MAX_POINTS - weekPoints };
  }
  const idx = ALBUM_TIERS.findIndex((t) => weekPoints >= t.min);
  const next = ALBUM_TIERS[idx - 1];
  return { rarity: next.rarity, star: false, missing: next.min - weekPoints };
}

export const METALLIC: ReadonlySet<Rarity> = new Set(["platinum", "gold", "silver", "bronze"]);

export type ShareSquare = "miss" | "hit" | "timeout" | "unopened";

/**
 * Fileira de 6 quadrados: vermelho = errou, preto = tempo esgotado, verde = acertou, bege = não abriu.
 * Palpites repetidos não entram nas tentativas, então cada tentativa é uma pista.
 */
export function shareSquares(attempts: readonly { correct: boolean; timeout?: boolean }[]): ShareSquare[] {
  const squares: ShareSquare[] = [];
  for (let i = 0; i < CLUE_COUNT; i++) {
    const a = attempts[i];
    squares.push(!a ? "unopened" : a.correct ? "hit" : a.timeout ? "timeout" : "miss");
  }
  return squares;
}

export const SHARE_EMOJI: Record<ShareSquare, string> = {
  miss: "🟥",
  hit: "🟩",
  timeout: "⬛",
  unopened: "⬜",
};

export type Screen = "no-puzzle" | "start" | "game" | "result";

/** Qual tela abrir: início (não começou), jogo (em andamento) ou resultado (terminou). */
export function screenFor(
  hasPuzzle: boolean,
  play: { started: boolean; finished: boolean } | null,
): Screen {
  if (!hasPuzzle) return "no-puzzle";
  if (!play?.started) return "start";
  return play.finished ? "result" : "game";
}
