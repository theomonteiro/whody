import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LeatherHeader } from "@/components/LeatherHeader";
import { Portrait } from "@/components/Portrait";
import { Sticker } from "@/components/Sticker";
import { parseRarity } from "@/lib/og";

type Props = { params: Promise<{ number: string; rarity: string }> };

async function parse(params: Props["params"]) {
  const { number, rarity } = await params;
  const n = Number.parseInt(number, 10);
  const r = parseRarity(rarity);
  if (!Number.isInteger(n) || n < 1 || !r) notFound();
  return { number: n, rarity: r };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { number, rarity } = await parse(params);
  const t = await getTranslations();
  const title = t("meta.shareTitle", { number, rarity: t(`rarity.${rarity}`) });
  return { title, openGraph: { title, description: t("meta.description") } };
}

/** Destino do link compartilhado: mostra a figurinha (sem nome) e chama pro jogo de hoje. */
export default async function SharedResultPage({ params }: Props) {
  const { number, rarity } = await parse(params);
  const t = await getTranslations();
  const sticker = rarity === "empty" ? null : rarity;

  return (
    <>
      <LeatherHeader>
        <Link href="/" className="inline-flex min-h-12 items-center font-display text-[30px] leading-none text-gold">
          {t("brand.logo")}
        </Link>
      </LeatherHeader>
      <main className="flex flex-1 flex-col items-center px-5 pt-8 pb-12 text-center">
        <p className="font-hand text-[26px] text-stamp -rotate-2">{t("sharePage.annotation")}</p>
        <h1 className="mt-1 font-display text-4xl text-ink">{t("sharePage.title", { number })}</h1>
        <p className="mt-1 font-display text-2xl text-ink-soft">{t(`rarity.${rarity}`)}</p>
        <Sticker rarity={sticker} tape className="mt-8 w-[200px] -rotate-2">
          <div className="rounded-[10px] bg-card p-2.5">
            <Portrait url={null} rarity={sticker} alt="" />
          </div>
        </Sticker>
        <p className="mt-8 max-w-xs text-ink-soft">{t("sharePage.body")}</p>
        <Link
          href="/"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-stamp font-display text-lg text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {t("sharePage.play")}
        </Link>
      </main>
    </>
  );
}
