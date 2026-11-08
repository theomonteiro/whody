type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function BookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} {...base}>
      <path d="M6 3h12v18H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M9 3v18" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} {...base}>
      <path d="M4 20h16M7 20v-5M12 20V9M17 20v-8" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" className={className} {...base}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function StopwatchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} {...base}>
      <circle cx="12" cy="14" r="7" />
      <path d="M12 14V10.5M10 3h4M12 3v4M18.5 7.5l1.5-1.5" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className={className} {...base}>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.6 4-8.3.6 1.8 1.6 2.9 2.7 3.4.3-2.3 1.3-4.6 3.1-6.4.4 3.2 3.2 5.6 3.2 10.6 0 4.2-2.7 6.9-6.5 6.9Z" />
    </svg>
  );
}
