import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AlbumCover } from "@/components/AlbumCover";
import { Avatar } from "@/components/Avatar";
import { FlameIcon } from "@/components/icons";
import { InviteLink } from "@/components/InviteLink";
import { HeaderBack, LeatherHeader } from "@/components/LeatherHeader";
import { Portrait } from "@/components/Portrait";
import { Sticker } from "@/components/Sticker";
import { card, secondaryButton } from "@/components/ui";
import { avatarFor } from "@/lib/avatar";
import { rarityForClue } from "@/lib/game/rules";
import type { GroupBoard, MemberStanding } from "@/lib/groups/queries";
import type { Ranking, TieCriterion } from "@/lib/groups/ranking";
import { getGroupScreen } from "@/lib/groups/service";
import { getViewer } from "@/lib/player";
import { siteUrl } from "@/lib/site";
import { leaveGroupAction } from "../actions";

export const dynamic = "force-dynamic";

const TABS = [
  { slug: "semanal", period: "week" },
  { slug: "mensal", period: "month" },
  { slug: "tudo", period: "all" },
] as const;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ p?: string; novo?: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata() {
  const t = await getTranslations("group");
  return { title: t("metaTitle") };
}

export default async function GroupPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { p, novo } = await searchParams;
  const viewer = await getViewer();
  if (!viewer.account || !viewer.playerId) redirect(`/entrar?next=${encodeURIComponent(`/grupos/${id}`)}`);
  if (!UUID.test(id)) notFound();

  // A participação é conferida no servidor: quem não é membro recebe 404, igual a grupo inexistente.
  const screen = await getGroupScreen(viewer.playerId, id);
  if (!screen) notFound();

  const t = await getTranslations();
  const format = await getFormatter();
  const { board, todayNumber } = screen;
  const me = viewer.playerId;
  const tab = TABS.find((x) => x.slug === p) ?? TABS[0];

  const nameOf = (n: string | null) => n ?? t("group.noName");
  const topStreak = board.members
    .map((m) => ({ ...m, streak: board.streaks[m.playerId]?.current ?? 0 }))
    .sort((a, b) => b.streak - a.streak || nameOf(a.name).localeCompare(nameOf(b.name), "pt-BR"))[0];
  const myStreak = board.streaks[me]?.current ?? 0;
  const inviteUrl = `${siteUrl()}/convite/${board.group.inviteCode}`;

  return (
    <>
      <LeatherHeader>
        <HeaderBack href="/grupos" label={t("group.backToGroups")} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-[28px] leading-none tracking-tight text-gold">{board.group.name}</h1>
          <p className="mt-1.5 font-mono text-[13px] font-bold text-gold">
            {t("group.memberCount", { count: board.members.length })}
          </p>
        </div>
      </LeatherHeader>

      <main className="flex-1 px-5 pt-6 pb-12">
        {novo && board.members.length === 1 && (
          <section aria-labelledby="invite-first" className={`${card} mb-6 p-4`}>
            <p className="font-hand text-2xl leading-none text-stamp -rotate-1">{t("group.inviteFirstAnnotation")}</p>
            <h2 id="invite-first" className="mt-1 font-display text-xl text-ink">
              {t("group.inviteFirstTitle")}
            </h2>
            <p className="mt-1 mb-3 text-[15px] text-ink-soft">{t("group.inviteFirstBody")}</p>
            <InviteLink url={inviteUrl} groupName={board.group.name} />
          </section>
        )}

        <section aria-labelledby="top-streak" className={`${card} flex items-stretch gap-4 p-4`}>
          <div className="min-w-0 flex-1">
            <h2
              id="top-streak"
              className="flex items-center gap-1.5 font-mono text-[13px] font-bold tracking-wide text-ink-soft uppercase"
            >
              <FlameIcon className="text-stamp" />
              {t("group.topStreakTitle")}
            </h2>
            {topStreak && topStreak.streak > 0 ? (
              <p className="mt-1.5 truncate font-display text-2xl leading-tight text-ink">
                {nameOf(topStreak.name)}
                <span className="ml-2 font-sans text-base font-medium text-ink-soft">
                  {t("group.days", { count: topStreak.streak })}
                </span>
              </p>
            ) : (
              <p className="mt-1.5 text-[15px] text-ink-soft">{t("group.topStreakNone")}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end justify-center border-l border-line pl-4">
            <p className="font-mono text-[13px] font-bold text-ink-soft">{t("group.yourStreak")}</p>
            <p className="font-display text-2xl leading-tight text-ink">
              {format.number(myStreak)}
              <span className="sr-only"> {t("group.days", { count: myStreak })}</span>
            </p>
          </div>
        </section>

        <nav aria-label={t("group.periodsLabel")} className="mt-7 grid grid-cols-3 gap-1 rounded-2xl bg-beige p-1">
          {TABS.map((x) => {
            const active = x.slug === tab.slug;
            return (
              <Link
                key={x.slug}
                href={`/grupos/${board.group.id}?p=${x.slug}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={`flex min-h-11 items-center justify-center rounded-xl text-[15px] font-semibold transition focus-visible:outline-2 focus-visible:outline-stamp ${
                  active ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                {t(`group.tab.${x.period}`)}
              </Link>
            );
          })}
        </nav>

        <section aria-labelledby="ranking" className="mt-4">
          <h2 id="ranking" className="sr-only">
            {t(`group.rankingTitle.${tab.period}`)}
          </h2>
          <RankingList ranking={board.rankings[tab.period]} period={tab.period} board={board} me={me} nameOf={nameOf} />
        </section>

        <section aria-labelledby="today" className="mt-9">
          <h2 id="today" className="font-display text-2xl text-ink">
            {todayNumber ? t("group.todayTitle", { number: todayNumber }) : t("group.todayNoPuzzle")}
          </h2>
          {todayNumber && <TodayList board={board} me={me} nameOf={nameOf} />}
        </section>

        <section aria-labelledby="invite" className="mt-10">
          <h2 id="invite" className="font-display text-xl text-ink">
            {t("group.inviteTitle")}
          </h2>
          <p className="mt-1 mb-3 text-[15px] text-ink-soft">{t("group.inviteBody")}</p>
          <InviteLink url={inviteUrl} groupName={board.group.name} />
        </section>

        <details className="mt-6">
          <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center text-[15px] font-medium text-ink-soft underline underline-offset-4">
            {t("group.leaveSummary")}
          </summary>
          <form action={leaveGroupAction} className="mt-3">
            <input type="hidden" name="groupId" value={board.group.id} />
            <p className="mb-3 text-center text-[15px] text-ink-soft">{t("group.leaveConfirmBody")}</p>
            <button type="submit" className={`${secondaryButton} !border-stamp !text-stamp`}>
              {t("group.leaveConfirm")}
            </button>
          </form>
        </details>
      </main>
    </>
  );
}

type ListProps = { board: GroupBoard; me: string; nameOf: (n: string | null) => string };

async function RankingList({
  ranking,
  period,
  board,
  me,
  nameOf,
}: ListProps & { ranking: Ranking<MemberStanding>; period: "week" | "month" | "all" }) {
  const t = await getTranslations();
  const format = await getFormatter();
  const criterion = (c: TieCriterion) => t(`group.tie.${c}`);
  const names = (entries: { name: string | null }[]) => format.list(entries.map((e) => nameOf(e.name)));

  return (
    <>
      <ol className="flex flex-col gap-1.5">
        {ranking.rows.map((row) => {
          const mine = row.playerId === me;
          const album = board.weekAlbum[row.playerId];
          const extra = board.allTime[row.playerId];
          const albumName = album ? t(album.star ? "rarity.diamondStar" : `rarity.${album.rarity}`) : "";
          return (
            <li
              key={row.playerId}
              aria-current={mine ? "true" : undefined}
              className={`flex min-h-16 items-center gap-3 rounded-xl px-3 py-2 ${mine ? "clue-card" : ""}`}
            >
              <span
                className={`w-7 shrink-0 text-center font-display text-xl ${row.position === 1 ? "text-stamp" : "text-ink"}`}
                aria-label={t("group.positionLabel", { position: row.position })}
              >
                {row.position}
              </span>
              <Avatar avatar={avatarFor(row.playerId, row.name)} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">
                  {nameOf(row.name)}
                  {mine && <span className="ml-1.5 text-sm text-ink-soft">{t("group.you")}</span>}
                </p>
                {period === "all" && extra && (
                  <p className="text-[13px] leading-snug text-ink-soft">
                    {t("group.allTimeExtra", { average: extra.average, albums: extra.diamondAlbums })}
                  </p>
                )}
              </div>
              {period === "week" && album && (
                <AlbumCover album={album} size="sm" label={t("group.weekAlbumLabel", { rarity: albumName })} />
              )}
              <p className="w-16 shrink-0 text-right font-display text-xl text-ink">
                {format.number(row.points)}
                <span className="ml-0.5 font-sans text-xs font-medium text-ink-soft">{t("group.pts")}</span>
              </p>
            </li>
          );
        })}
      </ol>
      {/* Desempate escondido: só aparece quando há empate de pontos de verdade. */}
      {ranking.ties.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 rounded-xl border border-dashed border-[#c9b99c] px-3 py-2.5">
          {ranking.ties.map((tie) => (
            <li key={tie.points} className="font-mono text-[13px] leading-snug text-ink-soft">
              {tie.decidedBy.length > 0
                ? t("group.tieLine", {
                    points: tie.points,
                    names: names(tie.entries),
                    criteria: format.list(tie.decidedBy.map(criterion)),
                  })
                : t("group.tieExact", { points: tie.points, names: names(tie.entries) })}
            </li>
          ))}
          <li className="font-mono text-[12px] leading-snug text-ink-soft">{t("group.tieRule")}</li>
        </ul>
      )}
    </>
  );
}

async function TodayList({ board, me, nameOf }: ListProps) {
  const t = await getTranslations();
  const format = await getFormatter();
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {board.today.map((entry) => {
        const rarity = rarityForClue(entry.solvedAtClue);
        const mine = entry.playerId === me;
        return (
          <li key={entry.playerId} className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 ${mine ? "clue-card" : ""}`}>
            <Avatar avatar={avatarFor(entry.playerId, entry.name)} />
            <p className="min-w-0 flex-1 truncate font-medium text-ink">
              {nameOf(entry.name)}
              {mine && <span className="ml-1.5 text-sm text-ink-soft">{t("group.you")}</span>}
            </p>
            {entry.status === "done" ? (
              <>
                {rarity ? (
                  <Sticker rarity={rarity} className="w-[30px] !rounded-md !p-[3px]">
                    {/* Busto genérico no tom da raridade: nunca o retrato da pessoa do dia. */}
                    <Portrait url={null} rarity={rarity} alt="" className="!rounded-[3px]" />
                  </Sticker>
                ) : (
                  <span aria-hidden className="block h-[36px] w-[29px] rounded-md border-2 border-dashed border-[#c9b99c]" />
                )}
                <p className="w-[118px] shrink-0 text-right font-mono text-[14px] leading-tight text-ink">
                  <span className="block font-bold">{t("group.points", { points: format.number(entry.points) })}</span>
                  <span className="text-ink-soft">
                    {entry.solvedAtClue ? t("group.solvedAt", { clue: entry.solvedAtClue }) : t("group.failedAll")}
                  </span>
                  <span className="sr-only">
                    {" "}
                    {t("group.stickerOf", { rarity: t(rarity ? `rarity.${rarity}` : "rarity.empty") })}
                  </span>
                </p>
              </>
            ) : (
              <p className="shrink-0 rounded-full border border-dashed border-[#c9b99c] px-3 py-1 font-mono text-[13px] font-bold text-ink-soft">
                {t("group.pending")}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
