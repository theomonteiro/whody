import Link from "next/link";
import { BackIcon } from "./icons";

/** Faixa de couro com costura, base do topo de todas as telas. */
export function LeatherHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="leather px-5 pt-4 pb-6">
      <div className="relative z-10 flex items-center gap-3">{children}</div>
    </header>
  );
}

const square =
  "inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-card text-ink shadow-sm " +
  "transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export function HeaderLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className={square}>
      {children}
    </Link>
  );
}

export function HeaderBack({ href, label }: { href: string; label: string }) {
  return (
    <HeaderLink href={href} label={label}>
      <BackIcon />
    </HeaderLink>
  );
}

export function HeaderDisabledButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button type="button" disabled aria-label={label} title={label} className={`${square} cursor-not-allowed opacity-60`}>
      {children}
    </button>
  );
}
