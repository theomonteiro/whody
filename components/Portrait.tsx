"use client";

import { useEffect, useState } from "react";
import type { Rarity } from "@/lib/game/rules";
import { BUST_FACETS, PORTRAIT_TONES } from "@/lib/portrait";

type Props = {
  url: string | null;
  rarity: Rarity | null;
  alt: string;
  className?: string;
};

/** Só os retratos do próprio site entram como SVG inline (pra receber as cores da raridade). */
const LOCAL_SVG = /^\/portraits\/[a-z0-9-]+\.svg$/;

const svgCache = new Map<string, Promise<string | null>>();

function loadSvg(url: string): Promise<string | null> {
  let pending = svgCache.get(url);
  if (!pending) {
    pending = fetch(url)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => (text?.trimStart().startsWith("<svg") ? text : null))
      .catch(() => null);
    svgCache.set(url, pending);
  }
  return pending;
}

/**
 * Retrato 3:4. Os retratos em polígonos de /portraits são desenhados inline, tingidos pela raridade
 * (--portrait-ink e --portrait-paper). Sem url, ou enquanto carrega, mostra o busto genérico.
 */
export function Portrait({ url, rarity, alt, className = "" }: Props) {
  const tone = PORTRAIT_TONES[rarity ?? "common"];
  const local = url !== null && LOCAL_SVG.test(url);
  const [svg, setSvg] = useState<{ url: string; markup: string } | null>(null);

  useEffect(() => {
    if (!local || !url) return;
    let alive = true;
    loadSvg(url).then((markup) => {
      if (alive && markup) setSvg({ url, markup });
    });
    return () => {
      alive = false;
    };
  }, [local, url]);

  const box = `aspect-[3/4] w-full overflow-hidden rounded-lg ${className}`;

  if (local && svg?.url === url) {
    return (
      <div
        role="img"
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`${box} [&>svg]:block [&>svg]:h-full [&>svg]:w-full`}
        style={
          {
            backgroundColor: tone.bg,
            "--portrait-ink": tone.ink,
            "--portrait-paper": tone.bg,
          } as React.CSSProperties
        }
        dangerouslySetInnerHTML={{ __html: svg.markup }}
      />
    );
  }

  if (url && !local) {
    // eslint-disable-next-line @next/next/no-img-element -- retratos externos podem ser SVG ou PNG
    return <img src={url} alt={alt} className={`${box} object-cover`} />;
  }

  return (
    <svg
      viewBox="0 0 120 160"
      role="img"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={box}
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
