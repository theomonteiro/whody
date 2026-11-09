import { describe, expect, it } from "vitest";
import { streakStats, type StreakDay } from "./streak";

const day = (date: string, played: boolean | "started" = true): StreakDay => ({
  date,
  started: played !== false,
  finished: played === true,
});

describe("streak", () => {
  it("conta dias seguidos jogados, mesmo errando tudo", () => {
    const days = [day("2026-11-07"), day("2026-11-08"), day("2026-11-09")];
    expect(streakStats(days, "2026-11-09")).toEqual({ current: 3, best: 3 });
  });

  it("hoje ainda não jogado não quebra a sequência", () => {
    const days = [day("2026-11-07"), day("2026-11-08"), day("2026-11-09", false)];
    expect(streakStats(days, "2026-11-09")).toEqual({ current: 2, best: 2 });
  });

  it("hoje começado e não terminado ainda não conta, mas também não quebra", () => {
    const days = [day("2026-11-08"), day("2026-11-09", "started")];
    expect(streakStats(days, "2026-11-09")).toEqual({ current: 1, best: 1 });
  });

  it("dia passado só começado conta (o tempo esgotou)", () => {
    const days = [day("2026-11-07", "started"), day("2026-11-08")];
    expect(streakStats(days, "2026-11-08")).toEqual({ current: 2, best: 2 });
  });

  it("um dia perdido zera a atual e guarda a maior", () => {
    const days = [
      day("2026-11-01"),
      day("2026-11-02"),
      day("2026-11-03"),
      day("2026-11-04", false),
      day("2026-11-05"),
    ];
    expect(streakStats(days, "2026-11-05")).toEqual({ current: 1, best: 3 });
  });

  it("dias sem pessoa (que não estão na lista) não quebram", () => {
    const days = [day("2026-11-01"), day("2026-11-03")];
    expect(streakStats(days, "2026-11-03")).toEqual({ current: 2, best: 2 });
  });

  it("perdeu ontem: atual é 0", () => {
    expect(streakStats([day("2026-11-07"), day("2026-11-08", false)], "2026-11-09")).toEqual({ current: 0, best: 1 });
  });

  it("ignora dias futuros e não depende da ordem", () => {
    const days = [day("2026-11-10"), day("2026-11-09"), day("2026-11-08")];
    expect(streakStats(days, "2026-11-09")).toEqual({ current: 2, best: 2 });
  });
});
