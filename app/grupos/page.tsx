import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HeaderBack, LeatherHeader } from "@/components/LeatherHeader";
import { card, primaryButton, secondaryButton, textInput } from "@/components/ui";
import { GROUP_NAME_MAX } from "@/lib/groups/queries";
import { getMyGroups } from "@/lib/groups/service";
import { getViewer } from "@/lib/player";
import { createGroupAction, openInviteAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ erro?: string; saiu?: string }> };

const ERRORS = ["nome", "limite", "codigo"] as const;

export async function generateMetadata() {
  const t = await getTranslations("groups");
  return { title: t("metaTitle") };
}

export default async function GroupsPage({ searchParams }: Props) {
  const viewer = await getViewer();
  if (!viewer.account || !viewer.playerId) redirect("/entrar?next=/grupos");
  const { erro, saiu } = await searchParams;
  const t = await getTranslations("groups");
  const th = await getTranslations("header");
  const groups = await getMyGroups(viewer.playerId);
  const error = ERRORS.find((e) => e === erro);

  return (
    <>
      <LeatherHeader>
        <HeaderBack href="/" label={th("back")} />
        <h1 className="font-display text-[28px] leading-none tracking-tight text-gold">{t("title")}</h1>
      </LeatherHeader>

      <main className="flex-1 px-5 pt-7 pb-12">
        <p role="status" className="empty:hidden mb-4 rounded-xl bg-card px-4 py-3 text-[15px] text-ink">
          {error ? t(`error.${error}`) : saiu ? t("left") : ""}
        </p>

        {groups.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/grupos/${g.id}`}
                  className="clue-card flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-stamp"
                >
                  <span className="truncate font-display text-xl text-ink">{g.name}</span>
                  <span className="shrink-0 font-mono text-sm font-bold text-ink-soft">
                    {t("members", { count: g.members })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center">
            <p className="font-hand text-[28px] leading-none text-stamp -rotate-2">{t("emptyAnnotation")}</p>
            <p className="mt-2 text-ink-soft">{t("emptyBody")}</p>
          </div>
        )}

        <section aria-labelledby="create" className={`${card} mt-8 p-4`}>
          <h2 id="create" className="font-display text-xl text-ink">
            {t("createTitle")}
          </h2>
          <form action={createGroupAction} className="mt-3">
            <label htmlFor="group-name" className="font-mono text-[13px] font-bold text-ink-soft">
              {t("nameLabel")}
            </label>
            <input
              id="group-name"
              name="name"
              required
              maxLength={GROUP_NAME_MAX}
              autoComplete="off"
              placeholder={t("namePlaceholder")}
              className={`${textInput} mt-1`}
            />
            <button type="submit" className={`${primaryButton} mt-3`}>
              {t("createButton")}
            </button>
          </form>
        </section>

        <section aria-labelledby="join" className={`${card} mt-4 p-4`}>
          <h2 id="join" className="font-display text-xl text-ink">
            {t("joinTitle")}
          </h2>
          <p className="mt-1 text-[15px] text-ink-soft">{t("joinBody")}</p>
          <form action={openInviteAction} className="mt-3">
            <label htmlFor="invite-code" className="font-mono text-[13px] font-bold text-ink-soft">
              {t("codeLabel")}
            </label>
            <input
              id="invite-code"
              name="code"
              required
              maxLength={8}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABCD2345"
              className={`${textInput} mt-1 uppercase`}
            />
            <button type="submit" className={`${secondaryButton} mt-3`}>
              {t("joinButton")}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
