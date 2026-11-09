import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LeatherHeader } from "@/components/LeatherHeader";
import { primaryButton, secondaryButton } from "@/components/ui";
import { joinGroupAction } from "@/app/grupos/actions";
import { appDb } from "@/lib/app-db";
import { groupByInvite, isMember, normalizeInviteCode } from "@/lib/groups/queries";
import { getViewer } from "@/lib/player";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata() {
  const t = await getTranslations("invite");
  return { title: t("metaTitle") };
}

/** Convite: quem tem o código vê só o nome do grupo; pra entrar precisa de conta. */
export default async function InvitePage({ params }: Props) {
  const code = normalizeInviteCode((await params).code);
  const t = await getTranslations();
  const exec = appDb().exec;
  const group = code ? await groupByInvite(exec, code) : null;
  const viewer = await getViewer();

  if (group && viewer.account && viewer.playerId && (await isMember(exec, viewer.playerId, group.id))) {
    redirect(`/grupos/${group.id}`);
  }

  return (
    <>
      <LeatherHeader>
        <Link href="/" className="inline-flex min-h-12 items-center font-display text-[30px] leading-none text-gold">
          {t("brand.logo")}
        </Link>
      </LeatherHeader>
      <main className="flex flex-1 flex-col items-center px-5 pt-10 pb-12 text-center">
        {group && code ? (
          <>
            <p className="font-hand text-[28px] leading-none text-stamp -rotate-2">{t("invite.annotation")}</p>
            <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">{group.name}</h1>
            <p className="mt-3 max-w-xs text-ink-soft">{t("invite.body")}</p>
            {viewer.account ? (
              <form action={joinGroupAction} className="mt-8 w-full">
                <input type="hidden" name="code" value={code} />
                <button type="submit" className={primaryButton}>
                  {t("invite.join")}
                </button>
              </form>
            ) : (
              <>
                <Link href={`/entrar?next=${encodeURIComponent(`/convite/${code}`)}`} className={`${primaryButton} mt-8`}>
                  {t("invite.loginToJoin")}
                </Link>
                <p className="mt-3 text-sm text-ink-soft">{t("invite.loginHint")}</p>
              </>
            )}
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl text-ink">{t("invite.notFoundTitle")}</h1>
            <p className="mt-3 max-w-xs text-ink-soft">{t("invite.notFoundBody")}</p>
            <Link href="/" className={`${secondaryButton} mt-8`}>
              {t("invite.play")}
            </Link>
          </>
        )}
      </main>
    </>
  );
}
