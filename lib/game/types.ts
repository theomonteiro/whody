// Formato do estado que chega ao navegador. Nada aqui pode conter pista fechada nem a resposta
// enquanto o jogo estiver em andamento: o servidor só preenche `text` e `reveal` quando pode.

export type PublicClue =
  | { position: number; value: number; open: false }
  | { position: number; value: number; open: true; text: string };

export type PublicAttempt = { guess: string; correct: boolean; timeout: boolean };

export type Reveal = {
  displayName: string;
  shortBio: string;
  years: string;
  portraitUrl: string | null;
  sources: { position: number; text: string; urls: string[] }[];
};

/** "not-started": tela de início; a partida (e o cronômetro) só existe depois do "Começar". */
export type GameStatus = "not-started" | "playing" | "solved" | "failed";

export type GameState = {
  puzzle: { number: number; date: string };
  status: GameStatus;
  openClues: number;
  clues: PublicClue[];
  attempts: PublicAttempt[];
  solvedAtClue: number | null;
  points: number;
  reveal: Reveal | null;
  stats: { weekPoints: number; streak: number };
  nextPuzzleAt: number;
  /** Prazo da pista atual (ms), sem a tolerância; null fora do jogo. */
  clueDeadline: number | null;
  /** Relógio do servidor (ms) quando o estado foi montado, pra o cliente corrigir o próprio relógio. */
  serverNow: number;
};

export type GuessOutcome =
  | "correct"
  | "wrong"
  | "failed"
  | "empty"
  | "repeated"
  | "finished"
  | "stale"
  | "not-started";

export type GuessResponse = { outcome: GuessOutcome; state: GameState | null };

export type AlbumDay = {
  date: string;
  number: number | null;
  status: "future" | "today" | "played" | "missed" | "no-puzzle";
  points: number;
  solvedAtClue: number | null;
  displayName: string | null;
  portraitUrl: string | null;
};

export type Album = {
  start: string;
  end: string;
  weekNumber: number;
  days: AlbumDay[];
  points: number;
  diamonds: number;
  daysPlayed: number;
  daysElapsed: number;
};
