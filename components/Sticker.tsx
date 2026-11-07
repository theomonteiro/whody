import { METALLIC, type Rarity } from "@/lib/game/rules";

type Props = {
  /** null = espaço vazio (contorno tracejado). */
  rarity: Rarity | null;
  children?: React.ReactNode;
  className?: string;
  tape?: boolean;
  corners?: boolean;
};

/** Moldura de figurinha por raridade, com os detalhes de scrapbook opcionais. */
export function Sticker({ rarity, children, className = "", tape = false, corners = false }: Props) {
  const frame = rarity ? `frame-${rarity}` : "frame-empty";
  const metallic = rarity && METALLIC.has(rarity) ? "frame-metallic" : "";
  return (
    <div className={`frame ${frame} ${metallic} ${className}`}>
      {tape && <span aria-hidden className="tape" />}
      {corners && (
        <>
          <span aria-hidden className="corner corner-tl" />
          <span aria-hidden className="corner corner-tr" />
          <span aria-hidden className="corner corner-bl" />
          <span aria-hidden className="corner corner-br" />
        </>
      )}
      {children}
    </div>
  );
}
