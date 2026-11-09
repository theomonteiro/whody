import type { AlbumRarity } from "@/lib/game/rules";
import { PORTRAIT_TONES } from "@/lib/portrait";
import { Sticker } from "./Sticker";

/**
 * Capa do álbum semanal: moldura da raridade (Diamante holográfico, metálicas com brilho, Comum papel)
 * e capa no tom dela, com lombada. `sm` é a capinha do ranking semanal; `lg` é a da coleção.
 */
export function AlbumCover({
  album,
  size,
  label,
  children,
}: {
  album: AlbumRarity;
  size: "sm" | "lg";
  label?: string;
  children?: React.ReactNode;
}) {
  const tone = PORTRAIT_TONES[album.rarity];
  const cover = { backgroundColor: tone.bg, boxShadow: `inset ${size === "sm" ? 4 : 7}px 0 0 ${tone.ink}` };

  if (size === "sm") {
    return (
      <Sticker rarity={album.rarity} className="!rounded-md !p-[3px]">
        <span
          role="img"
          aria-label={label}
          className="flex h-[34px] w-[26px] items-center justify-center rounded-[3px] pl-1"
          style={cover}
        >
          {album.star && (
            <span aria-hidden className="font-display text-[13px] leading-none" style={{ color: tone.ink }}>
              ★
            </span>
          )}
        </span>
      </Sticker>
    );
  }
  return (
    <Sticker rarity={album.rarity} className="!p-[6px]">
      <div className="flex aspect-[3/4] flex-col justify-between rounded-md py-2.5 pr-2.5 pl-4" style={cover}>
        {children}
      </div>
    </Sticker>
  );
}
