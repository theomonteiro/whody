import "server-only";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { defaultLocale } from "@/i18n/config";
import { pointsForClue, RARITIES, type Rarity } from "./game/rules";
import { bustSvg } from "./portrait";

export const OG_SIZE = { width: 1200, height: 630 };

const FRAMES: Record<Rarity, string> = {
  diamond: "linear-gradient(135deg, #9BE7F0, #C9B6FF 38%, #FFC2E2 62%, #A8F0D0)",
  platinum: "linear-gradient(135deg, #EEF2F6, #AEB9C6 45%, #F7F9FB 60%, #97A3B2)",
  gold: "linear-gradient(135deg, #F7D774, #C9932B 45%, #FBE6A2 60%, #B07D1E)",
  silver: "linear-gradient(135deg, #E6E8EB, #9EA3AA 50%, #D4D7DB)",
  bronze: "linear-gradient(135deg, #E6A87A, #9C5A2E 50%, #D4905F)",
  common: "linear-gradient(135deg, #FFFFFF, #EDE7DA)",
};

export function parseRarity(value: string): Rarity | "empty" | null {
  if (value === "empty") return "empty";
  return (RARITIES as readonly string[]).includes(value) ? (value as Rarity) : null;
}

/** Baixa uma fonte do Google Fonts só com os caracteres usados (o next/og não lê woff2). */
async function googleFont(family: string, weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** Imagem de prévia: a figurinha da raridade obtida, sem o nome da pessoa. */
export async function stickerImage(opts: { number: number | null; rarity: Rarity | "empty" | "mystery" }) {
  const t = await getTranslations({ locale: defaultLocale });
  const { rarity, number } = opts;
  const isRarity = rarity !== "empty" && rarity !== "mystery";
  const points = isRarity ? pointsForClue(RARITIES.indexOf(rarity) + 1) : 0;

  const logo = t("brand.logo");
  const title = number === null ? t("meta.ogTagline") : t("share.heading", { number });
  const big = isRarity ? t(`rarity.${rarity}`) : rarity === "empty" ? t("rarity.empty") : "?";
  const sub = number === null ? t("meta.ogCta") : t("meta.ogPoints", { points });
  const hand = t("meta.ogTagline");

  const display = await googleFont("Bricolage+Grotesque", 800, `${logo}${title}${big}${sub}?`);
  const hand2 = await googleFont("Caveat", 600, hand);
  const fonts = [
    ...(display ? [{ name: "Bricolage", data: display, weight: 800 as const }] : []),
    ...(hand2 ? [{ name: "Caveat", data: hand2, weight: 600 as const }] : []),
  ];

  const portrait = `data:image/svg+xml;base64,${Buffer.from(
    bustSvg(rarity === "empty" ? "common" : rarity),
  ).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 80,
          padding: "0 110px",
          backgroundColor: "#F4EDE0",
          backgroundImage: "radial-gradient(#DCCFB6 2px, transparent 2.4px)",
          backgroundSize: "32px 32px",
          fontFamily: "Bricolage",
          color: "#241C17",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 330,
            height: 440,
            padding: 14,
            borderRadius: 28,
            transform: "rotate(-4deg)",
            background: isRarity ? FRAMES[rarity] : rarity === "mystery" ? FRAMES.diamond : "transparent",
            border: rarity === "empty" ? "5px dashed #B9A684" : "none",
            boxShadow: "0 18px 40px rgba(36,28,23,.22)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -22,
              left: 85,
              width: 160,
              height: 42,
              background: "rgba(236,199,92,.75)",
              transform: "rotate(-3deg)",
            }}
          />
          <div style={{ display: "flex", flex: 1, borderRadius: 18, overflow: "hidden", background: "#FFFDF8", padding: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={portrait} alt="" width={278} height={388} style={{ borderRadius: 12, objectFit: "cover" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 44, color: "#5A3925" }}>{logo}</div>
          <div style={{ fontSize: 40, color: "#6B5B4E", marginTop: 10 }}>{title}</div>
          <div style={{ fontSize: 112, lineHeight: 1, marginTop: 18, letterSpacing: -3 }}>{big}</div>
          <div style={{ fontSize: 48, color: "#6B5B4E", marginTop: 18 }}>{sub}</div>
          {number !== null && (
            <div style={{ fontFamily: "Caveat", fontSize: 54, color: "#B8341F", marginTop: 26, transform: "rotate(-2deg)" }}>
              {hand}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
