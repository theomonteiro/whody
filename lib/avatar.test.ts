import { describe, expect, it } from "vitest";
import { AVATAR_COLORS, avatarColor, cleanName, initials, suggestName } from "./avatar";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("avatar", () => {
  it("todas as cores têm contraste ≥ 4,5:1 com as iniciais brancas", () => {
    for (const c of AVATAR_COLORS) expect(1.05 / (luminance(c) + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it("a cor é fixa por jogador", () => {
    const id = "3f2b8c1e-7a4d-4e2f-9b1c-0d5e6f7a8b9c";
    expect(avatarColor(id)).toBe(avatarColor(id));
    expect(AVATAR_COLORS).toContain(avatarColor(id));
  });

  it("iniciais", () => {
    expect(initials("Ana Paula Souza")).toBe("AS");
    expect(initials("theo")).toBe("T");
    expect(initials("  ")).toBe("?");
    expect(initials(null)).toBe("?");
    expect(initials("élio ávila")).toBe("ÉÁ");
  });
});

describe("nome do jogador", () => {
  it("limpa espaços e recusa vazio ou longo demais", () => {
    expect(cleanName("  Ana   Paula ")).toBe("Ana Paula");
    expect(cleanName("")).toBeNull();
    expect(cleanName("x".repeat(21))).toBeNull();
    expect(cleanName(42)).toBeNull();
  });

  it("sugere o primeiro nome do Google", () => {
    expect(suggestName({ given_name: "Theo", full_name: "Theo Monteiro" })).toBe("Theo");
    expect(suggestName({ full_name: "Maria Clara Dias" })).toBe("Maria");
    expect(suggestName({ name: "Bia" })).toBe("Bia");
    expect(suggestName(undefined)).toBe("");
  });
});
