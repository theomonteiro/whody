import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { HeaderBack, LeatherHeader } from "@/components/LeatherHeader";
import { Portrait } from "@/components/Portrait";
import { Sticker } from "@/components/Sticker";
import { getAlbum } from "@/lib/game/service";
import { albumRarity, nextAlbumGoal, rarityForClue, WEEK_MAX_POINTS } from "@/lib/game/rules";
import type { AlbumDay } from "@/lib/game/types";
import { currentPlayerId } from "@/lib/player";
import { dateFromIso } from "@/lib/site";
import { gameDate } from "@/lib/time";

export const dynamic = "force-dynamic";

/** Marcas na barra de progresso, no início de cada faixa do álbum. */
const TIER_MARKS = [201, 301, 401, 501, 601];

export default async function AlbumPage() {
  const t = await getTranslations();
  const format = await getFormatter();
  const today = gameDate();
  const album = await getAlbum(await currentPlayerId(), today);

  const { rarity, star } = albumRarity(album.points);
  const rarityName = t(star ? "rarity.diamondStar" : `rarity.${rarity}`);
  const goal = nextAlbumGoal(album.points);
  const close = goal && goal.missing <= 100 && album.daysPlayed > 0;
  const average = album.daysPlayed ? Math.round(album.points / album.daysPlayed) : 0;
  const range = format.dateTimeRange(dateFromIso(album.start), dateFromIso(album.end), { day: "numeric", month: "short" });
  const isSunday = today === album.end;

  return (
    <>
      <LeatherHeader>
        <HeaderBack href="/" label={t("header.back")} />
        <div className="min-w-0">
          <h1 className="font-display text-[28px] leading-none tracking-tight text-gold">{t("album.title")}</h1>
          <p className="mt-1.5 font-mono text-[13px] font-bold text-gold">
            {t("album.subtitle", { week: album.weekNumber, range })}
          </p>
        </div>
      </LeatherHeader>

      <main className="flex-1 px-5 pt-7 pb-10">
        <section aria-labelledby="album-rarity">
          {(close || star) && (
            <p className="font-hand text-2xl leading-none text-stamp -rotate-1">
              {star ? t("album.perfect") : t("album.almost", { rarity: t(`rarity.${goal!.rarity}`).toLowerCase() })}
            </p>
          )}
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <h2 id="album-rarity" className="font-display text-[32px] leading-tight tracking-tight text-ink">
              {t("album.albumName", { rarity: rarityName })}
            </h2>
            <p className="shrink-0 font-display text-[40px] leading-none text-ink">
              {format.number(album.points)}
              <span className="ml-1 font-sans text-base font-medium text-ink-soft">
                {t("album.outOf", { max: WEEK_MAX_POINTS })}
              </span>
            </p>
          </div>
          <div
            className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-beige"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={WEEK_MAX_POINTS}
            aria-valuenow={album.points}
            aria-label={t("album.progressLabel", { points: album.points, max: WEEK_MAX_POINTS })}
          >
            <div className="h-full rounded-full bg-ink" style={{ width: `${(album.points / WEEK_MAX_POINTS) * 100}%` }} />
            {TIER_MARKS.map((m) => (
              <span
                key={m}
                aria-hidden
                className="absolute top-0 h-full w-0.5 bg-paper"
                style={{ left: `${(m / WEEK_MAX_POINTS) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[15px] text-ink-soft">
            <p>
              {goal
                ? goal.star
                  ? t("album.missingStar", { missing: goal.missing })
                  : t("album.missing", { missing: goal.missing, rarity: t(`rarity.${goal.rarity}`) })
                : t("album.maxed")}
            </p>
            <p className="shrink-0">{isSunday ? t("album.closesTonight") : t("album.closesSunday")}</p>
          </div>
        </section>

        <ol className="mt-7 grid grid-cols-3 gap-x-3.5 gap-y-5">
          {album.days.map((day) => (
            <AlbumSlot key={day.date} day={day} today={today} />
          ))}
          <li className="col-span-2 self-start rounded-2xl border border-line bg-card p-5">
            <h3 className="sr-only">{t("album.summaryTitle")}</h3>
            <dl className="flex flex-col gap-2.5 text-[17px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">{t("album.diamonds")}</dt>
                <dd className="font-bold text-ink">{format.number(album.diamonds)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">{t("album.average")}</dt>
                <dd className="font-bold text-ink">{t("album.averageValue", { points: average })}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">{t("album.daysPlayed")}</dt>
                <dd className="font-bold text-ink">
                  {t("album.daysPlayedValue", { played: album.daysPlayed, total: album.daysElapsed })}
                </dd>
              </div>
            </dl>
          </li>
        </ol>
      </main>
    </>
  );
}

async function AlbumSlot({ day, today }: { day: AlbumDay; today: string }) {
  const t = await getTranslations();
  const format = await getFormatter();
  const weekday = format.dateTime(dateFromIso(day.date), { weekday: "short" });
  const rarity = rarityForClue(day.solvedAtClue);

  if (day.status === "played" && rarity && day.displayName) {
    const rarityName = t(`rarity.${rarity}`);
    return (
      <li>
        <Sticker rarity={rarity} corners className="!p-[6px]">
          <div
            className="rounded-md bg-card p-1.5"
            role="img"
            aria-label={t("album.stickerLabel", { name: day.displayName, rarity: rarityName, points: day.points })}
          >
            <Portrait url={day.portraitUrl} rarity={rarity} alt="" />
            <p className="mt-1 truncate font-display text-[13px] text-ink">{day.displayName}</p>
          </div>
        </Sticker>
        <SlotCaption weekday={weekday} points={day.points} />
      </li>
    );
  }

  const label =
    day.status === "future"
      ? t("album.slotFuture")
      : day.status === "today"
        ? t("album.slotToday")
        : day.status === "no-puzzle"
          ? t("album.slotNoPuzzle")
          : day.status === "played"
            ? t("album.slotFailed")
            : t("album.slotEmpty");

  const slot = (
    <div className="flex aspect-[3/4.4] items-center justify-center rounded-[14px] border-2 border-dashed border-[#c9b99c] p-2 text-center">
      <span className="font-mono text-sm font-bold text-ink-soft">{label}</span>
    </div>
  );

  return (
    <li aria-label={t("album.slotLabel", { weekday, status: label })}>
      {day.status === "today" && day.date === today ? (
        <Link href="/" className="block rounded-[14px] transition hover:bg-card focus-visible:outline-2 focus-visible:outline-stamp">
          {slot}
        </Link>
      ) : (
        slot
      )}
      <SlotCaption weekday={weekday} points={day.status === "played" ? day.points : null} />
    </li>
  );
}

function SlotCaption({ weekday, points }: { weekday: string; points: number | null }) {
  return (
    <p aria-hidden className="mt-1.5 flex justify-between font-mono text-sm font-bold text-ink">
      <span>{weekday}</span>
      <span className="text-ink-soft">{points ?? ""}</span>
    </p>
  );
}
