import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/Avatar";
import { LeatherHeader } from "@/components/LeatherHeader";
import { primaryButton, textInput } from "@/components/ui";
import { saveNameAction } from "@/app/perfil/actions";
import { avatarFor, NAME_MAX, suggestName } from "@/lib/avatar";
import { getViewer } from "@/lib/player";
import { safeNext } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string; erro?: string }> };

/** Primeiro login: o jogador escolhe como aparece nos grupos (sugere o primeiro nome do Google). */
export default async function WelcomePage({ searchParams }: Props) {
  const { next: rawNext, erro } = await searchParams;
  const next = safeNext(rawNext);
  const viewer = await getViewer();
  if (!viewer.account || !viewer.playerId) redirect(`/entrar?next=${encodeURIComponent(next)}`);
  const t = await getTranslations();
  const suggestion = viewer.account.name ?? suggestName(viewer.account.meta);

  return (
    <>
      <LeatherHeader>
        <p className="inline-flex min-h-12 items-center font-display text-[30px] leading-none text-gold">{t("brand.logo")}</p>
      </LeatherHeader>
      <main className="flex flex-1 flex-col px-5 pt-8 pb-12">
        <p className="font-hand text-[28px] leading-none text-stamp -rotate-2">{t("welcome.annotation")}</p>
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-ink">{t("welcome.title")}</h1>
        <p className="mt-2 text-ink-soft">{t("welcome.body")}</p>
        <form action={saveNameAction} className="mt-6">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="from" value="bem-vindo" />
          <label htmlFor="name" className="font-mono text-[13px] font-bold text-ink-soft">
            {t("welcome.nameLabel")}
          </label>
          <div className="mt-1 flex items-center gap-3">
            <Avatar avatar={avatarFor(viewer.playerId, suggestion || null)} size="md" />
            <input
              id="name"
              name="name"
              required
              maxLength={NAME_MAX}
              defaultValue={suggestion}
              autoComplete="given-name"
              className={textInput}
              aria-describedby={erro ? "name-error" : undefined}
            />
          </div>
          {erro && (
            <p id="name-error" role="alert" className="mt-2 text-[15px] text-stamp">
              {t("welcome.error", { max: NAME_MAX })}
            </p>
          )}
          <button type="submit" className={`${primaryButton} mt-6`}>
            {t("welcome.save")}
          </button>
        </form>
      </main>
    </>
  );
}
