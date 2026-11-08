import "server-only";

// Conteúdo da Fase 1. Este arquivo é a fonte da verdade: `npm run db:seed` copia tudo pro banco.
// Nunca importe isto num componente de cliente; o import "server-only" quebra o build se acontecer.
//
// Como cadastrar uma pessoa: veja o README ("Cadastrar pessoas") ou use a skill /whody-pessoa.
// Pessoa com qualquer TODO (pista, descrição ou anos) entra no banco, mas não é agendada.

export const TODO = "TODO";

export type Clue = {
  text: string;
  /**
   * Links das fontes que comprovam a pista (aparecem em "Saiba mais").
   * Pelo menos 1; fato surpreendente, número ou citação pede 2 independentes.
   */
  sources: string[];
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

// Fontes usadas em mais de uma pista.
const FAB_SANTOS_DUMONT = "https://www2.fab.mil.br/cendoc/index.php/biografia";
const BRITANNICA_SANTOS_DUMONT = "https://www.britannica.com/biography/Alberto-Santos-Dumont";
const SMITHSONIAN_SANTOS_DUMONT = "https://smithsonianeducation.org/scitech/impacto/graphic/aviation/alberto.html";
const ABL_MACHADO = "https://www.academia.org.br/academicos/machado-de-assis/biografia";
const BRITANNICA_MACHADO = "https://www.britannica.com/biography/Joaquim-Maria-Machado-de-Assis";
const SITE_TARSILA = "https://www.tarsiladoamaraloficial.com.br/blank-1";
const BRITANNICA_TARSILA = "https://www.britannica.com/biography/Tarsila-do-Amaral";
const BRITANNICA_NIEMEYER = "https://www.britannica.com/biography/Oscar-Niemeyer";
const PRITZKER_NIEMEYER = "https://www.pritzkerprize.com/laureates/1988-niemeyer";
const NOBEL_CURIE = "https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/";
const BRITANNICA_CURIE = "https://www.britannica.com/biography/Marie-Curie";
const BRITANNICA_SENNA = "https://www.britannica.com/biography/Ayrton-Senna";
const HONDA_SENNA = "https://global.honda/en/F1/driver/AyrtonSenna/";
const BRITANNICA_CLARICE = "https://www.britannica.com/biography/Clarice-Lispector";
const FAPESP_CLARICE = "https://revistapesquisa.fapesp.br/a-escritora-das-entrelinhas/";

export const people: Person[] = [
  {
    id: "santos-dumont",
    locale: "pt-BR",
    displayName: "Santos Dumont",
    acceptedNames: ["santos dumont", "alberto santos dumont", "dumont"],
    shortBio: "Aviador e inventor",
    years: "1873–1932",
    portraitUrl: "/portraits/santos-dumont.svg",
    clues: [
      {
        text: "Pediu a um amigo joalheiro um relógio que desse para usar no pulso. O modelo virou peça de luxo e é vendido até hoje.",
        sources: [
          "https://www.cartier.com/en-us/watches/collections/santos-de-cartier/santos-dumont-watch-CRWSSA0085.html",
          "https://robbreport.com.my/style/watches/cartier-santos-dumont-alberto-aviation/",
        ],
      },
      {
        text: "Nasceu em Minas Gerais, em 1873, filho de um engenheiro que virou um dos maiores produtores de café do país.",
        sources: [
          FAB_SANTOS_DUMONT,
          "https://www.gazetadopovo.com.br/brasil/henrique-dumont-o-pai-de-santos-dumont-foi-o-rei-do-cafe-no-brasil/",
        ],
      },
      {
        text: "Morou boa parte da vida em Paris, onde chegou a usar um pequeno dirigível para circular pela cidade.",
        sources: ["https://en.wikisource.org/wiki/My_Airships/Chapter_22", FAB_SANTOS_DUMONT],
      },
      {
        text: "Em 1901, contornou a Torre Eiffel pelo ar e ganhou o Prêmio Deutsch. Dividiu o dinheiro entre seus mecânicos e os pobres de Paris.",
        sources: [BRITANNICA_SANTOS_DUMONT, SMITHSONIAN_SANTOS_DUMONT],
      },
      {
        text: "Em 1906, decolou com o 14-Bis diante de uma multidão em Paris.",
        sources: [FAB_SANTOS_DUMONT, BRITANNICA_SANTOS_DUMONT],
      },
      {
        text: "No Brasil, é chamado de Pai da Aviação.",
        sources: [FAB_SANTOS_DUMONT, SMITHSONIAN_SANTOS_DUMONT],
      },
    ],
  },
  {
    id: "machado-de-assis",
    locale: "pt-BR",
    displayName: "Machado de Assis",
    acceptedNames: ["machado de assis", "joaquim maria machado de assis", "machado"],
    shortBio: "Escritor",
    years: "1839–1908",
    portraitUrl: "/portraits/machado-de-assis.svg",
    clues: [
      {
        text: "Aos 17 anos, arrumou emprego como aprendiz de tipógrafo e passou a escrever nas horas vagas.",
        sources: [ABL_MACHADO, BRITANNICA_MACHADO],
      },
      {
        text: "Foi funcionário público num ministério por décadas; o emprego foi seu principal sustento até o fim da vida.",
        sources: [ABL_MACHADO, BRITANNICA_MACHADO],
      },
      {
        text: "Nasceu no Rio de Janeiro em 1839, filho de um pintor, e foi criado no Morro do Livramento.",
        sources: [ABL_MACHADO, BRITANNICA_MACHADO],
      },
      {
        text: "Casou-se com Carolina, irmã de um amigo. Foi poeta, cronista e crítico de teatro antes de virar romancista.",
        sources: [ABL_MACHADO, BRITANNICA_MACHADO],
      },
      {
        text: "Foi o primeiro presidente da Academia Brasileira de Letras e ficou no cargo até morrer.",
        sources: [ABL_MACHADO, BRITANNICA_MACHADO],
      },
      {
        text: "Escreveu Dom Casmurro e Memórias Póstumas de Brás Cubas.",
        sources: [BRITANNICA_MACHADO, ABL_MACHADO],
      },
    ],
  },
  {
    id: "tarsila-do-amaral",
    locale: "pt-BR",
    displayName: "Tarsila do Amaral",
    acceptedNames: ["tarsila do amaral", "tarsila"],
    shortBio: "Pintora modernista",
    years: "1886–1973",
    portraitUrl: null,
    clues: [
      {
        text: "Em 1931, viajou à União Soviética, e a viagem mudou os temas do seu trabalho.",
        sources: [BRITANNICA_TARSILA, SITE_TARSILA],
      },
      {
        text: "Em Paris, teve aulas com os cubistas Fernand Léger, André Lhote e Albert Gleizes.",
        sources: [BRITANNICA_TARSILA, SITE_TARSILA],
      },
      {
        text: "Nasceu em 1886 no interior de São Paulo, filha de fazendeiro, e passou a infância nas fazendas do pai.",
        sources: [SITE_TARSILA, BRITANNICA_TARSILA],
      },
      {
        text: "Em 1923, pintou A Negra, tela que juntou o cubismo a temas brasileiros.",
        sources: [BRITANNICA_TARSILA, SITE_TARSILA],
      },
      {
        text: "Foi casada com o escritor Oswald de Andrade e viajou com ele pelo Brasil atrás de temas nacionais.",
        sources: [BRITANNICA_TARSILA, SITE_TARSILA],
      },
      {
        text: "Pintou o Abaporu, que inspirou o Manifesto Antropófago.",
        sources: [BRITANNICA_TARSILA, SITE_TARSILA],
      },
    ],
  },
  {
    id: "oscar-niemeyer",
    locale: "pt-BR",
    displayName: "Oscar Niemeyer",
    acceptedNames: ["oscar niemeyer", "niemeyer", "oscar niemeyer soares filho"],
    shortBio: "Arquiteto",
    years: "1907–2012",
    portraitUrl: null,
    clues: [
      {
        text: "Continuou trabalhando depois de completar 100 anos, ainda começando projetos novos.",
        sources: [BRITANNICA_NIEMEYER],
      },
      {
        text: "Uma das obras dele em Paris é a sede do Partido Comunista Francês.",
        sources: [BRITANNICA_NIEMEYER, PRITZKER_NIEMEYER],
      },
      {
        text: "Nasceu no Rio de Janeiro em 1907 e estudou na Escola Nacional de Belas Artes.",
        sources: [BRITANNICA_NIEMEYER, PRITZKER_NIEMEYER],
      },
      {
        text: "Trabalhou no projeto da sede da ONU, em Nova York, ao lado de Le Corbusier.",
        sources: [PRITZKER_NIEMEYER, BRITANNICA_NIEMEYER],
      },
      {
        text: "Projetou a igreja de São Francisco de Assis e o cassino da Pampulha, em Belo Horizonte.",
        sources: ["https://whc.unesco.org/en/list/1493/", BRITANNICA_NIEMEYER],
      },
      {
        text: "Projetou os principais prédios de Brasília, como o Congresso Nacional e a Catedral.",
        sources: [BRITANNICA_NIEMEYER, PRITZKER_NIEMEYER],
      },
    ],
  },
  {
    id: "marie-curie",
    locale: "pt-BR",
    displayName: "Marie Curie",
    acceptedNames: [
      "marie curie",
      "curie",
      "madame curie",
      "maria sklodowska",
      "marie sklodowska curie",
      "maria sklodowska curie",
    ],
    shortBio: "Física e química",
    years: "1867–1934",
    portraitUrl: null,
    clues: [
      {
        text: "Em 1926, passou mais de um mês no Brasil dando conferências no Rio, em São Paulo e em Belo Horizonte.",
        sources: [
          "https://memoria.abc.org.br/en/marie-curie-in-brazil/",
          "https://revistapesquisa.fapesp.br/mineiros-contra-o-cancer/",
        ],
      },
      {
        text: "Na Primeira Guerra Mundial, levou aparelhos de raio X até soldados feridos, com a ajuda da filha.",
        sources: [BRITANNICA_CURIE, NOBEL_CURIE],
      },
      {
        text: "Nasceu em Varsóvia, em 1867, e se mudou para Paris em 1891 para estudar na Sorbonne.",
        sources: [NOBEL_CURIE, BRITANNICA_CURIE],
      },
      {
        text: "Foi a primeira mulher a dar aula na Sorbonne, na vaga deixada pela morte do marido.",
        sources: [BRITANNICA_CURIE, NOBEL_CURIE],
      },
      {
        text: "Batizou um elemento químico em homenagem ao país onde nasceu.",
        sources: [BRITANNICA_CURIE, NOBEL_CURIE],
      },
      {
        text: "É a única mulher a ganhar o Nobel em duas áreas diferentes: Física e Química.",
        sources: [BRITANNICA_CURIE, NOBEL_CURIE],
      },
    ],
  },
  {
    id: "ayrton-senna",
    locale: "pt-BR",
    displayName: "Ayrton Senna",
    acceptedNames: ["ayrton senna", "senna", "ayrton senna da silva", "ayrton"],
    shortBio: "Piloto de Fórmula 1",
    years: "1960–1994",
    portraitUrl: null,
    clues: [
      {
        text: "Em 1981, chegou a anunciar a aposentadoria e voltou ao Brasil para trabalhar na empresa da família, mas desistiu meses depois.",
        sources: [BRITANNICA_SENNA, HONDA_SENNA],
      },
      {
        text: "Aos 4 anos, começou a andar num kart construído pelo pai.",
        sources: [HONDA_SENNA, BRITANNICA_SENNA],
      },
      {
        text: "Nasceu em São Paulo, em 1960, filho de um empresário.",
        sources: [BRITANNICA_SENNA, HONDA_SENNA],
      },
      {
        text: "Estreou na Fórmula 1 em 1984, pela Toleman, e terminou em segundo em Mônaco debaixo de chuva.",
        sources: [HONDA_SENNA, BRITANNICA_SENNA],
      },
      {
        text: "Na McLaren, travou uma rivalidade famosa com o colega de equipe Alain Prost.",
        sources: [BRITANNICA_SENNA, HONDA_SENNA],
      },
      {
        text: "Tricampeão mundial de Fórmula 1, morreu num acidente no Grande Prêmio de San Marino, em 1994.",
        sources: [BRITANNICA_SENNA, HONDA_SENNA],
      },
    ],
  },
  {
    id: "clarice-lispector",
    locale: "pt-BR",
    displayName: "Clarice Lispector",
    acceptedNames: ["clarice lispector", "clarice", "lispector"],
    shortBio: "Escritora",
    years: "1920–1977",
    portraitUrl: null,
    clues: [
      {
        text: "Estudou Direito e se casou com um colega de faculdade que depois virou diplomata.",
        sources: [FAPESP_CLARICE, BRITANNICA_CLARICE],
      },
      {
        text: "Acompanhando o marido, morou anos fora do Brasil, em lugares como Nápoles, a Suíça e Washington.",
        sources: [
          FAPESP_CLARICE,
          "https://site.claricelispector.ims.com.br/en/2024/09/10/clarices-days-in-washington/",
        ],
      },
      {
        text: "Nasceu na Ucrânia, numa família judia que fugiu para o Brasil quando ela ainda era pequena.",
        sources: [BRITANNICA_CLARICE, FAPESP_CLARICE],
      },
      {
        text: "Passou a infância no Recife e, já no Rio, trabalhou como jornalista.",
        sources: [FAPESP_CLARICE, BRITANNICA_CLARICE],
      },
      {
        text: "Escreveu A Paixão Segundo G.H. e o livro de contos Laços de Família.",
        sources: [BRITANNICA_CLARICE, FAPESP_CLARICE],
      },
      {
        text: "Escreveu A Hora da Estrela, publicado em 1977, ano em que morreu.",
        sources: [BRITANNICA_CLARICE, FAPESP_CLARICE],
      },
    ],
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
