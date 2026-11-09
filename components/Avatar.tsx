import type { AvatarData } from "@/lib/avatar";

const SIZES = { sm: "size-10 text-sm", md: "size-12 text-base", lg: "size-16 text-xl" } as const;

/** Iniciais sobre a cor fixa do jogador. Decorativo: o nome sempre aparece ao lado. */
export function Avatar({ avatar, size = "sm" }: { avatar: AvatarData; size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display leading-none text-white ${SIZES[size]}`}
      style={{ backgroundColor: avatar.color }}
    >
      {avatar.initials}
    </span>
  );
}
