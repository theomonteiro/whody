// Avatar = iniciais sobre uma cor fixa por jogador (sai do id, então nunca muda).

/** Fundos escuros: todos com contraste ≥ 4,5:1 com texto branco (conferido em avatar.test.ts). */
export const AVATAR_COLORS = [
  "#B8341F", // vermelho carimbo
  "#2F6B4F", // verde
  "#2F4A55", // petróleo
  "#5A3925", // couro
  "#7A4E12", // mostarda escura
  "#33404F", // ardósia
  "#7A2E4A", // vinho
  "#4E3F7A", // roxo
] as const;

function hash(text: string): number {
  // FNV-1a 32 bits
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function avatarColor(playerId: string): string {
  return AVATAR_COLORS[hash(playerId) % AVATAR_COLORS.length];
}

/** Até duas iniciais: primeira e última palavra ("Ana Paula Souza" → "AS"); uma palavra → 1 letra. */
export function initials(name: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
  return (first + last).toLocaleUpperCase("pt-BR");
}

export type AvatarData = { initials: string; color: string };

export function avatarFor(playerId: string, name: string | null): AvatarData {
  return { initials: initials(name), color: avatarColor(playerId) };
}

export const NAME_MAX = 20;

/** Limpa o nome escolhido: tira espaços sobrando e controles; null se ficar vazio ou longo demais. */
export function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (!name || Array.from(name).length > NAME_MAX) return null;
  return name;
}

/** Sugestão de nome a partir do perfil do Google: o primeiro nome. */
export function suggestName(meta: Record<string, unknown> | undefined): string {
  const pick = (k: string) => (typeof meta?.[k] === "string" ? (meta[k] as string).trim() : "");
  const given = pick("given_name");
  const full = pick("full_name") || pick("name");
  const first = given || full.split(/\s+/)[0] || "";
  return Array.from(first).slice(0, NAME_MAX).join("");
}
