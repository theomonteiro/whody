import { getTranslations } from "next-intl/server";
import { OG_SIZE, stickerImage } from "@/lib/og";

export const contentType = "image/png";

export async function generateImageMetadata() {
  const t = await getTranslations("meta");
  return [{ id: "home", alt: t("ogHomeAlt"), size: OG_SIZE, contentType }];
}

export default async function Image() {
  return stickerImage({ number: null, rarity: "mystery" });
}
