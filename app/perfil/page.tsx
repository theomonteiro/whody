import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { AlbumCover } from "@/components/AlbumCover";
import { Avatar } from "@/components/Avatar";
import { HeaderBack, LeatherHeader } from "@/components/LeatherHeader";
import { card, primaryButton, secondaryButton, textInput } from "@/components/ui";
import { appDb } from "@/lib/app-db";
import { avatarFor, NAME_MAX } from "@/lib/avatar";
import { albumRarity, WEEK_MAX_POINTS } from "@/lib/game/rules";
import { getStreakStats } from "@/lib/game/service";
import { pastAlbums } from "@/lib/groups/queries";
import { getViewer } from "@/lib/player";
import { dateFromIso } from "@/lib/site";
import { addDays, gameDate, isoWeekNumber, weekStart } from "@/lib/time";
import { saveNameAction } from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ erro?: string; salvo?: string }> };

export async function generateMetadata() {
  const t = await getTranslations("profile");
  return { title: t("metaTitle") };
}

/** Página do jogador: streaks e a coleção de álbuns das semanas anteriores. */
export default async function ProfilePage({ searchParams }: Props) {
  const { erro, salvo } = await searchParams;
  const t = await getTranslations();
  const format = await getFormatter();
  const viewer = await getViewer();
  const today = gameDate();
  const playerId = viewer.playerId;
  const [streak, albums] = await Promise.all([
    getStreakStats(playerId, today),
    playerId ? pastAlbums(appDb().exec, playerId, weekStart(today)) : Promise.resolve([]),
  ]);
  const name = viewer.account?.name ?? null;

  return (
    <>
      <LeatherHeader>
        <HeaderBack href="/" label={t("header.back")} />
        <h1 className="font-display text-[28px] leading-none tracking-tight text-gold">{t("profile.title")}</h1>
      </LeatherHeader>

      <main className="flex-1 px-5 pt-7 pb-12">
        <section aria-labelledby="who" className="flex items-center gap-4">
          {viewer.account && playerId ? (
            <Avatar avatar={avatarFor(playerId, name)} size="lg" />
          ) : (
            <span aria-hidden className="size-16 shrink-0 rounded-full border-2 border-dashed border-[#c9b99c]" />
          )}
          <div className="min-w-0">
            <h2 id="who" className="truncate font-display text-3xl leading-tight text-ink">
              {viewer.account ? (name ?? t("group.noName")) : t("profile.anonymous")}
            </h2>
            <p className="text-[15px] text-ink-soft">
              {viewer.account ? t("profile.accountHint") : t("profile.anonymousHint")}
            </p>
          </div>
        </section>

        <dl className="mt-7 grid grid-cols-2 divide-x divide-line text-center">
          <div className="flex flex-col">
            <dt className="text-[15px] text-ink-soft">{t("profile.currentStreak")}</dt>
            <dd className="-order-1 font-display text-4xl text-ink">{format.number(streak.current)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-[15px] text-ink-soft">{t("profile.bestStreak")}</dt>
            <dd className="-order-1 font-display text-4xl text-ink">{format.number(streak.best)}</dd>
          </div>
        </dl>

        {!viewer.account && (
          <Link href="/entrar?next=/perfil" className={`${primaryButton} mt-7`}>
            {t("profile.login")}
          </Link>
        )}

        <section aria-labelledby="collection" className="mt-10">
          <h2 id="collection" className="font-display text-2xl text-ink">
            {t("profile.collectionTitle")}
          </h2>
          {albums.length === 0 ? (
            <p className="mt-2 text-ink-soft">{t("profile.collectionEmpty")}</p>
          ) : (
            <ol className="mt-4 grid grid-cols-3 gap-x-3.5 gap-y-5">
              {albums.map((a) => {
                const rarity = albumRarity(a.points);
                const rarityName = t(rarity.star ? "rarity.diamondStar" : `rarity.${rarity.rarity}`);
                const range = format.dateTimeRange(dateFromIso(a.weekStart), dateFromIso(addDays(a.weekStart, 6)), {
                  day: "2-digit",
                  month: "2-digit",
                });
                return (
                  <li
                    key={a.weekStart}
                    aria-label={t("profile.albumLabel", { week: isoWeekNumber(a.weekStart), range, rarity: rarityName, points: a.points })}
                  >
                    <AlbumCover album={rarity} size="lg">
                      <p aria-hidden className="font-mono text-[12px] font-bold text-ink">
                        {t("profile.albumWeek", { week: isoWeekNumber(a.weekStart) })}
                      </p>
                      <p aria-hidden className="text-center font-display text-[15px] leading-tight text-ink">
                        {rarityName}
                      </p>
                      <p aria-hidden className="text-right font-display text-lg leading-none text-ink">
                        {format.number(a.points)}
                        <span className="font-sans text-[10px] font-medium text-ink-soft">/{WEEK_MAX_POINTS}</span>
                      </p>
                    </AlbumCover>
                    <p aria-hidden className="mt-1.5 truncate text-center font-mono text-[13px] font-bold text-ink-soft">
                      {range}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {viewer.account && (
          <section aria-labelledby="account" className={`${card} mt-10 p-4`}>
            <h2 id="account" className="font-display text-xl text-ink">
              {t("profile.accountTitle")}
            </h2>
            <form action={saveNameAction} className="mt-3">
              <input type="hidden" name="from" value="perfil" />
              <label htmlFor="name" className="font-mono text-[13px] font-bold text-ink-soft">
                {t("welcome.nameLabel")}
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={NAME_MAX}
                defaultValue={name ?? ""}
                autoComplete="given-name"
                className={`${textInput} mt-1`}
              />
              <p role="status" className="mt-1.5 min-h-5 text-sm text-ink-soft">
                {erro ? t("welcome.error", { max: NAME_MAX }) : salvo ? t("profile.saved") : ""}
              </p>
              <button type="submit" className={`${secondaryButton} mt-1`}>
                {t("profile.saveName")}
              </button>
            </form>
            <form action="/auth/sair" method="post" className="mt-3">
              <button
                type="submit"
                className="mx-auto flex min-h-11 items-center text-[15px] font-medium text-ink-soft underline underline-offset-4"
              >
                {t("profile.logout")}
              </button>
            </form>
          </section>
        )}
      </main>
    </>
  );
}
