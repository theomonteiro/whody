import type { Rarity } from "@/lib/game/rules";
import { BUST_FACETS, PORTRAIT_TONES } from "@/lib/portrait";

type Props = {
  url: string | null;
  rarity: Rarity | null;
  alt: string;
  className?: string;
};

/** Retrato 3:4. Sem url, desenha o busto genérico em polígonos no tom da raridade. */
export function Portrait({ url, rarity, alt, className = "" }: Props) {
  const tone = PORTRAIT_TONES[rarity ?? "common"];
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- retratos podem ser SVG externos
    return <img src={url} alt={alt} className={`aspect-[3/4] w-full rounded-lg object-cover ${className}`} />;
  }
  return (
    <svg
      viewBox="0 0 120 160"
      role="img"
      aria-label={alt}
      className={`aspect-[3/4] w-full rounded-lg ${className}`}
      preserveAspectRatio="xMidYMax slice"
    >
      <rect width="120" height="160" fill={tone.bg} />
      {BUST_FACETS.map((f, i) => (
        <g key={i}>
          <polygon points={f.points} fill={tone.bust} />
          <polygon points={f.points} fill={f.shade > 0 ? "#fff" : "#000"} fillOpacity={Math.abs(f.shade)} />
        </g>
      ))}
    </svg>
  );
}
