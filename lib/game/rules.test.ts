import { describe, expect, it } from "vitest";
import { albumRarity, nextAlbumGoal, pointsForClue, rarityForClue, shareSquares } from "./rules";

describe("pontos e figurinhas", () => {
  it("dá pontos e raridade pela pista do acerto", () => {
    expect([1, 2, 3, 4, 5, 6].map(pointsForClue)).toEqual([100, 80, 60, 40, 20, 5]);
    expect(rarityForClue(1)).toBe("diamond");
    expect(rarityForClue(6)).toBe("common");
    expect(rarityForClue(null)).toBeNull();
  });
});

describe("álbum semanal", () => {
  it("segue as faixas de pontos", () => {
    expect(albumRarity(0)).toEqual({ rarity: "common", star: false });
    expect(albumRarity(200)).toEqual({ rarity: "common", star: false });
    expect(albumRarity(201)).toEqual({ rarity: "bronze", star: false });
    expect(albumRarity(400)).toEqual({ rarity: "silver", star: false });
    expect(albumRarity(500)).toEqual({ rarity: "gold", star: false });
    expect(albumRarity(600)).toEqual({ rarity: "platinum", star: false });
    expect(albumRarity(601)).toEqual({ rarity: "diamond", star: false });
    expect(albumRarity(700)).toEqual({ rarity: "diamond", star: true });
  });

  it("calcula quanto falta pro próximo degrau", () => {
    expect(nextAlbumGoal(540)).toEqual({ rarity: "diamond", star: false, missing: 61 });
    expect(nextAlbumGoal(0)).toEqual({ rarity: "bronze", star: false, missing: 201 });
    expect(nextAlbumGoal(650)).toEqual({ rarity: "diamond", star: true, missing: 50 });
    expect(nextAlbumGoal(700)).toBeNull();
  });
});

describe("compartilhar", () => {
  it("monta a fileira de quadrados", () => {
    expect(shareSquares([false, true])).toEqual(["miss", "hit", "unopened", "unopened", "unopened", "unopened"]);
    expect(shareSquares([false, false, false, false, false, false])).toEqual(Array(6).fill("miss"));
  });
});
