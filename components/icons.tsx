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

/** "G" do Google, nas cores oficiais (o guia de marca do Google pede o logo no botão de login). */
export function GoogleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}
