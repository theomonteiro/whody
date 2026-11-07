import { describe, expect, it } from "vitest";
import { judgeGuess, levenshtein, normalize, tolerance } from "./judge";

const dumont = ["santos dumont", "alberto santos dumont", "dumont"];
const others = [
  ["pele", "edson arantes do nascimento", "rei pele"],
  ["machado de assis", "joaquim maria machado de assis", "machado"],
  ["ayrton senna", "senna"],
];

describe("normalize", () => {
  it("remove acentos, pontuação e espaços extras", () => {
    expect(normalize("  Pelé!! ")).toBe("pele");
    expect(normalize("Santos-Dumont")).toBe("santos dumont");
    expect(normalize("ÁLBERTO   santos\tDUMONT")).toBe("alberto santos dumont");
    expect(normalize("14-Bis")).toBe("14 bis");
  });
});

describe("levenshtein", () => {
  it("calcula a distância de edição", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("dumont", "dumont")).toBe(0);
  });
});

describe("tolerance", () => {
  it("varia com o tamanho do palpite", () => {
    expect(tolerance("pele")).toBe(0);
    expect(tolerance("abcde")).toBe(0);
    expect(tolerance("dumont")).toBe(1);
    expect(tolerance("abcdefghij")).toBe(1);
    expect(tolerance("santos dumot")).toBe(2);
  });
});

describe("judgeGuess", () => {
  it("aceita 'Santos Dumot' (erro de digitação)", () => {
    expect(judgeGuess("Santos Dumot", dumont, others)).toBe("correct");
  });

  it("aceita 'dumont'", () => {
    expect(judgeGuess("dumont", dumont, others)).toBe("correct");
  });

  it("recusa 'Pelé'", () => {
    expect(judgeGuess("Pelé", dumont, others)).toBe("wrong");
  });

  it("ignora palpite vazio", () => {
    expect(judgeGuess("", dumont, others)).toBe("empty");
    expect(judgeGuess("   ", dumont, others)).toBe("empty");
    expect(judgeGuess("?!.", dumont, others)).toBe("empty");
  });

  it("não tolera erro em palpites curtos", () => {
    expect(judgeGuess("Senna", ["ayrton senna", "senna"], [])).toBe("correct");
    expect(judgeGuess("Sena", ["ayrton senna", "senna"], [])).toBe("wrong");
  });

  it("recusa quando outra pessoa está tão perto quanto a resposta", () => {
    const answer = ["ronaldo"];
    const twin = [["ronaldo", "ronaldinho"]];
    expect(judgeGuess("Ronaldo", answer, twin)).toBe("wrong");
  });

  it("recusa quando outra pessoa está mais perto", () => {
    const answer = ["joao silva"];
    const close = [["joao silvo"]];
    expect(judgeGuess("joao silvo", answer, close)).toBe("wrong");
  });
});
