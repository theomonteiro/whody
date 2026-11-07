import { getTranslations } from "next-intl/server";
import { OG_SIZE, parseRarity, stickerImage } from "@/lib/og";

export const contentType = "image/png";

type Params = { number: string; rarity: string };

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { number, rarity } = await params;
  const t = await getTranslations();
  const parsed = parseRarity(rarity) ?? "empty";
  return [
    {
      id: "sticker",
      alt: t("meta.ogAlt", { number, rarity: t(`rarity.${parsed}`) }),
      size: OG_SIZE,
      contentType,
    },
  ];
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { number, rarity } = await params;
  return stickerImage({ number: Number.parseInt(number, 10) || 0, rarity: parseRarity(rarity) ?? "empty" });
}
