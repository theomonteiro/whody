import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LeatherHeader } from "@/components/LeatherHeader";
import { secondaryButton } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations();
  return (
    <>
      <LeatherHeader>
        <Link href="/" className="inline-flex min-h-12 items-center font-display text-[30px] leading-none text-gold">
          {t("brand.logo")}
        </Link>
      </LeatherHeader>
      <main className="flex flex-1 flex-col items-center px-5 pt-14 pb-12 text-center">
        <h1 className="font-display text-4xl text-ink">{t("notFound.title")}</h1>
        <p className="mt-3 max-w-xs text-ink-soft">{t("notFound.body")}</p>
        <Link href="/" className={`${secondaryButton} mt-8`}>
          {t("notFound.play")}
        </Link>
      </main>
    </>
  );
}
