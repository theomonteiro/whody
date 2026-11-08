// Busto genérico low-poly (3:4), no tom da raridade. Usado pelo <Portrait> e pelas imagens de prévia.
import type { Rarity } from "./game/rules";

/**
 * bg = fundo, bust = cor do busto genérico, ink = traço mais escuro dos retratos reais
 * (os SVGs em public/portraits misturam --portrait-ink com --portrait-paper em 7 tons).
 */
export const PORTRAIT_TONES: Record<Rarity | "mystery", { bg: string; bust: string; ink: string }> = {
  // ink/bg seguem o CLAUDE.md ("Retratos"); bust é só do busto genérico.
  diamond: { bg: "#DDF1F4", bust: "#557A82", ink: "#2F4A55" },
  platinum: { bg: "#DDE4EC", bust: "#6A7787", ink: "#33404F" },
  gold: { bg: "#F6E7BE", bust: "#866A2F", ink: "#5A4214" },
  silver: { bg: "#E4E6E9", bust: "#767B84", ink: "#3E4248" },
  bronze: { bg: "#F0D9C6", bust: "#8C5D43", ink: "#5A3420" },
  common: { bg: "#ECE5D7", bust: "#6B6258", ink: "#4A3F36" },
  mystery: { bg: "#2E241D", bust: "#4A3B30", ink: "#120D0A" },
};

type Facet = { points: string; shade: number };

function headFacets(): Facet[] {
  const cx = 60;
  const cy = 64;
  const r = 23;
  const n = 10;
  const shades = [0.22, 0.08, -0.06, 0.14, -0.14, 0.02, -0.2, 0.1, -0.04, 0.18];
  const vertex = (i: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rx = r * (i % 2 === 0 ? 1 : 0.94);
    return `${(cx + rx * Math.cos(a)).toFixed(1)},${(cy + rx * 1.12 * Math.sin(a)).toFixed(1)}`;
  };
  return Array.from({ length: n }, (_, i) => ({
    points: `${cx},${cy} ${vertex(i)} ${vertex(i + 1)}`,
    shade: shades[i],
  }));
}

const BODY: Facet[] = [
  { points: "52,86 68,86 60,104", shade: -0.18 },
  { points: "52,86 60,104 50,104", shade: 0.04 },
  { points: "68,86 70,104 60,104", shade: -0.08 },
  { points: "14,160 30,116 44,160", shade: -0.12 },
  { points: "30,116 50,104 44,160", shade: 0.1 },
  { points: "50,104 60,108 60,160 44,160", shade: 0.2 },
  { points: "60,108 70,104 76,160 60,160", shade: 0.04 },
  { points: "70,104 90,116 76,160", shade: -0.06 },
  { points: "90,116 106,160 76,160", shade: -0.2 },
];

export const BUST_FACETS: Facet[] = [...BODY, ...headFacets()];

/** Mesmo desenho em string SVG, pra next/og (que aceita <img> com data URI). */
export function bustSvg(tone: Rarity | "mystery"): string {
  const { bg, bust } = PORTRAIT_TONES[tone];
  const facets = BUST_FACETS.map(
    (f) =>
      `<polygon points="${f.points}" fill="${bust}"/>` +
      `<polygon points="${f.points}" fill="${f.shade > 0 ? "#fff" : "#000"}" fill-opacity="${Math.abs(f.shade)}"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><rect width="120" height="160" fill="${bg}"/>${facets}</svg>`;
}
