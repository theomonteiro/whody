import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { GoogleIcon } from "@/components/icons";
import { HeaderBack, LeatherHeader } from "@/components/LeatherHeader";
import { getViewer } from "@/lib/player";
import { safeNext } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; erro?: string }> };

export async function generateMetadata() {
  const t = await getTranslations("login");
  return { title: t("metaTitle") };
}

/** Login com o Google. Jogar não precisa: só grupos (e o histórico entre aparelhos). */
export default async function LoginPage({ searchParams }: Props) {
  const { next: rawNext, erro } = await searchParams;
  const next = safeNext(rawNext);
  const viewer = await getViewer();
  if (viewer.account) redirect(viewer.account.name ? next : `/bem-vindo?next=${encodeURIComponent(next)}`);
  const t = await getTranslations();

  return (
    <>
      <LeatherHeader>
        <HeaderBack href="/" label={t("header.back")} />
        <h1 className="font-display text-[28px] leading-none tracking-tight text-gold">{t("login.title")}</h1>
      </LeatherHeader>
      <main className="flex flex-1 flex-col px-5 pt-8 pb-12">
        <p className="font-hand text-[28px] leading-none text-stamp -rotate-2">{t("login.annotation")}</p>
        <h2 className="mt-2 font-display text-3xl leading-tight tracking-tight text-ink">{t("login.heading")}</h2>
        <ul className="mt-4 flex flex-col gap-2 text-[17px] text-ink">
          <li>{t("login.why1")}</li>
          <li>{t("login.why2")}</li>
          <li>{t("login.why3")}</li>
        </ul>
        {erro && (
          <p role="alert" className="mt-6 rounded-xl bg-card px-4 py-3 text-[15px] text-stamp">
            {erro === "config" ? t("login.errorConfig") : t("login.error")}
          </p>
        )}
        {/* Link normal (GET): a rota inicia o fluxo PKCE no servidor e manda pro Google. */}
        <a
          href={`/auth/entrar?next=${encodeURIComponent(next)}`}
          className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-[1.5px] border-ink bg-card font-display text-lg text-ink transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
        >
          <GoogleIcon />
          {t("login.google")}
        </a>
        <p className="mt-4 text-center text-sm text-ink-soft">{t("login.noAccountNeeded")}</p>
      </main>
    </>
  );
}
