import "server-only";

// Conteúdo da Fase 1. Este arquivo é a fonte da verdade: `npm run db:seed` copia tudo pro banco.
// Nunca importe isto num componente de cliente; o import "server-only" quebra o build se acontecer.
//
// Como cadastrar uma pessoa: veja o README ("Cadastrar pessoas").
// Pessoa com qualquer TODO (pista, descrição ou anos) entra no banco, mas não é agendada.

export const TODO = "TODO";

export type Clue = {
  text: string;
  /** Link da fonte que comprova a pista (aparece em "Saiba mais"). */
  sourceUrl: string | null;
};

export type Person = {
  /** Slug estável: não mude depois de agendar. */
  id: string;
  locale: "pt-BR";
  displayName: string;
  /** Nome completo, nome artístico e apelidos. A normalização tira acento e caixa. */
  acceptedNames: string[];
  shortBio: string;
  years: string;
  portraitUrl: string | null;
  /** Da mais obscura (1) à mais óbvia (6). */
  clues: [Clue, Clue, Clue, Clue, Clue, Clue];
};

const todoClues = (): Person["clues"] => [
  { text: TODO, sourceUrl: null },
  { text: TODO, sourceUrl: null },
  { text: TODO, sourceUrl: null },
  { text: TODO, sourceUrl: null },
  { text: TODO, sourceUrl: null },
  { text: TODO, sourceUrl: null },
];

export const people: Person[] = [
  {
    id: "santos-dumont",
    locale: "pt-BR",
    displayName: "Santos Dumont",
    acceptedNames: ["santos dumont", "alberto santos dumont", "dumont"],
    shortBio: "Aviador e inventor",
    years: "1873–1932",
    portraitUrl: null,
    clues: [
      {
        text: "Pediu a um amigo joalheiro um relógio que desse para usar no pulso. O modelo virou peça de luxo e é vendido até hoje.",
        sourceUrl: null, // TODO: fonte
      },
      {
        text: "Nasceu em Minas Gerais, em 1873, filho de um engenheiro que virou um dos maiores produtores de café do país.",
        sourceUrl: null, // TODO: fonte
      },
      {
        text: "Morou boa parte da vida em Paris, onde chegou a usar um pequeno dirigível para circular pela cidade.",
        sourceUrl: null, // TODO: fonte
      },
      {
        text: "Em 1901, contornou a Torre Eiffel pelo ar e ganhou o Prêmio Deutsch. Dividiu o dinheiro entre seus mecânicos e os pobres de Paris.",
        sourceUrl: null, // TODO: fonte
      },
      {
        text: "Em 1906, decolou com o 14-Bis diante de uma multidão em Paris.",
        sourceUrl: null, // TODO: fonte
      },
      {
        text: "No Brasil, é chamado de Pai da Aviação.",
        sourceUrl: null, // TODO: fonte
      },
    ],
  },
  // As seis abaixo só têm o nome. Preencha nomes aceitos, descrição, anos e as 6 pistas com fonte.
  {
    id: "machado-de-assis",
    locale: "pt-BR",
    displayName: "Machado de Assis",
    acceptedNames: ["machado de assis"], // TODO: completar
    shortBio: TODO,
    years: TODO,
    portraitUrl: null,
    clues: todoClues(),
  },
  {
    id: "tarsila-do-amaral",
    locale: "pt-BR",
    displayName: "Tarsila do Amaral",
    acceptedNames: ["tarsila do amaral"], // TODO: completar
    shortBio: TODO,
    years: TODO,
    portraitUrl: null,
    clues: todoClues(),
  },
  {
    id: "oscar-niemeyer",
    locale: "pt-BR",
    displayName: "Oscar Niemeyer",
    acceptedNames: ["oscar niemeyer"], // TODO: completar
    shortBio: TODO,
    years: TODO,
    portraitUrl: null,
    clues: todoClues(),
  },
  {
    id: "marie-curie",
    locale: "pt-BR",
    displayName: "Marie Curie",
    acceptedNames: ["marie curie"], // TODO: completar
    shortBio: TODO,
    years: TODO,
    portraitUrl: null,
    clues: todoClues(),
  },
  {
    id: "ayrton-senna",
    locale: "pt-BR",
    displayName: "Ayrton Senna",
    acceptedNames: ["ayrton senna"], // TODO: completar
    shortBio: TODO,
    years: TODO,
    portraitUrl: null,
    clues: todoClues(),
  },
  {
    id: "clarice-lispector",
    locale: "pt-BR",
    displayName: "Clarice Lispector",
    acceptedNames: ["clarice lispector"], // TODO: completar
    shortBio: TODO,
    years: TODO,
    portraitUrl: null,
    clues: todoClues(),
  },
];

/**
 * Agenda: uma pessoa por data (fuso de Brasília). O número do dia (#1, #2...)
 * sai da data, contando a partir de PUZZLE_EPOCH em lib/time.ts.
 */
export const schedule: { date: string; personId: string }[] = [
  { date: "2026-11-07", personId: "santos-dumont" },
  { date: "2026-11-08", personId: "machado-de-assis" },
  { date: "2026-11-09", personId: "tarsila-do-amaral" },
  { date: "2026-11-10", personId: "oscar-niemeyer" },
  { date: "2026-11-11", personId: "marie-curie" },
  { date: "2026-11-12", personId: "ayrton-senna" },
  { date: "2026-11-13", personId: "clarice-lispector" },
];

export function hasTodo(person: Person): boolean {
  return (
    person.shortBio.includes(TODO) ||
    person.years.includes(TODO) ||
    person.clues.some((c) => c.text.includes(TODO))
  );
}
