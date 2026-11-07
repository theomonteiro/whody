"use client";

import { useEffect, useState } from "react";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Contagem regressiva até `target` (ms). Quando zera, recarrega pra trazer a próxima pessoa. */
export function Countdown({ target }: { target: number }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = target - Date.now();
      setLeft(ms);
      if (ms <= 0) window.location.reload();
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [target]);

  return <time className="tabular-nums">{left === null ? "--:--:--" : format(left)}</time>;
}
