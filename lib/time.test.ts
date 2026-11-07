import { describe, expect, it } from "vitest";
import { gameDate, isoWeekNumber, midnightAt, nextPuzzleAt, puzzleNumberFor, weekDates, weekStart } from "./time";

describe("fuso de Brasília", () => {
  it("vira o dia à meia-noite de São Paulo, não de UTC", () => {
    // 02:59 UTC de 8/11 ainda é 23:59 de 7/11 em Brasília
    expect(gameDate(new Date("2026-11-08T02:59:00Z"))).toBe("2026-11-07");
    expect(gameDate(new Date("2026-11-08T03:00:00Z"))).toBe("2026-11-08");
  });

  it("calcula a meia-noite local em UTC", () => {
    expect(new Date(midnightAt("2026-11-08")).toISOString()).toBe("2026-11-08T03:00:00.000Z");
    expect(new Date(nextPuzzleAt(new Date("2026-11-07T20:00:00Z"))).toISOString()).toBe(
      "2026-11-08T03:00:00.000Z",
    );
  });
});

describe("semana do álbum", () => {
  it("vai de segunda a domingo", () => {
    expect(weekStart("2026-11-07")).toBe("2026-11-02"); // sábado
    expect(weekStart("2026-11-08")).toBe("2026-11-02"); // domingo
    expect(weekStart("2026-11-09")).toBe("2026-11-09"); // segunda
    expect(weekDates("2026-11-07")).toEqual([
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
  });

  it("numera a semana pelo ISO", () => {
    expect(isoWeekNumber("2026-11-07")).toBe(45);
    expect(isoWeekNumber("2027-01-01")).toBe(53);
  });
});

describe("número do puzzle", () => {
  it("começa em 1 na data de estreia", () => {
    expect(puzzleNumberFor("2026-11-07")).toBe(1);
    expect(puzzleNumberFor("2026-11-13")).toBe(7);
  });
});
