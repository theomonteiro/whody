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
const UZH_EINSTEIN = "https://uzh.ch/en/researchinnovation/excellence/nobelprize/einstein.html";
const FAPESP_EINSTEIN_BERNA = "https://revistapesquisa.fapesp.br/ver-e-relativo/";
const FAPESP_EINSTEIN_BRASIL = "https://revistapesquisa.fapesp.br/alfredo-tolmasquim-um-cientista-nos-tropicos/";
const ENC_CARMEN = "https://www.encyclopedia.com/women/encyclopedias-almanacs-transcripts-and-maps/miranda-carmen-1909-1955";
const USP_CARMEN = "https://sites.usp.br/portalatinoamericano/espanol-miranda-carmen";
const ALESP_CARMEN = "https://www.al.sp.gov.br/noticia/?id=270370";
const FUNDACAO_MANDELA = "https://www.nelsonmandela.org/content/page/biography";
const CIDOB_MANDELA = "https://www.cidob.org/biografias_lideres_politicos/africa/sudafrica/nelson_mandela";
const HISTORIA_MANDELA = "https://www.historiadomundo.com.br/idade-contemporanea/nelson-mandela.htm";
const MUSEU_FRIDA = "https://www.museofridakahlo.org.mx/frida/?lang=en";
const POMPIDOU_FRIDA = "https://www.centrepompidou.fr/en/magazine/article/focus-sur-the-frame-de-frida-kahlo";
const NMWA_FRIDA = "https://www.nmwa.org/art/artists/frida-kahlo/";
const ISTOE_PELE = "https://istoe.com.br/pele-nao-morre-pele-se-eterniza";
const ESPN_PELE = "https://espndeportes.espn.com/futbol/nota/_/id/11303865/pele-leyenda-eterna-vida-pelicula-muerte";
const BIOGRAPHY_PELE = "https://www.biography.com/athlete/pele";
const PBS_AE_CHAPLIN = "https://www.pbs.org/wgbh/americanexperience/features/pickford-charlie-chaplin-1889-1977";
const PBS_AM_CHAPLIN = "https://www.pbs.org/wnet/americanmasters/charlie-chaplin-biographical-timeline/14049";
const ENC_CHAPLIN = "https://www.encyclopedia.com/history/encyclopedias-almanacs-transcripts-and-maps/chaplin-charlie-sir-charles-spencer-1889-1977";
const BIOGRAPHY_CHAPLIN = "https://www.biography.com/actors/charlie-chaplin";
const USP_ELIS = "https://sites.usp.br/portalatinoamericano/espanol-elis-regina";
const SESC_ELIS = "https://portal.sescsp.org.br/online/artigo/compartilhar/10645_UMA+ESTRELA+BRILHA";

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
  {
    id: "albert-einstein",
    locale: "pt-BR",
    displayName: "Albert Einstein",
    acceptedNames: ["albert einstein", "einstein"],
    shortBio: "Físico",
    years: "1879–1955",
    portraitUrl: null,
    clues: [
      {
        text: "Em 1952, foi convidado para ser presidente de Israel e recusou.",
        sources: [
          "https://www.jewishvirtuallibrary.org/offering-the-presidency-of-israel-to-albert-einstein",
          "https://www.jta.org/archive/embassy-reveals-details-of-offer-of-israel-presidency-to-einstein",
        ],
      },
      {
        text: "Em 1925, passou cerca de uma semana no Rio de Janeiro dando palestras em lugares como a Escola Politécnica e o Clube de Engenharia.",
        sources: [
          FAPESP_EINSTEIN_BRASIL,
          "https://diariodorio.com/historias-do-rio-de-janeiro/2026/11/15/albert-einstein-passou-sete-dias-no-rio-e-deixou-desabafo-surpreendente-antes-de-ir-embora.html",
        ],
      },
      {
        text: "Trabalhou de 1902 a 1909 num escritório de patentes na Suíça, onde escreveu alguns de seus trabalhos mais importantes.",
        sources: [UZH_EINSTEIN, FAPESP_EINSTEIN_BERNA],
      },
      {
        text: "Nasceu em Ulm, na Alemanha, em 1879, e em 1933 emigrou para os Estados Unidos, de onde nunca mais voltou à Europa.",
        sources: [UZH_EINSTEIN, FAPESP_EINSTEIN_BERNA],
      },
      {
        text: "Ganhou o Nobel de Física de 1921 pela lei do efeito fotoelétrico, e não pela teoria que o deixou famoso.",
        sources: [UZH_EINSTEIN],
      },
      {
        text: "Criou a teoria da relatividade, da qual vem a equação E = mc².",
        sources: [UZH_EINSTEIN, FAPESP_EINSTEIN_BERNA],
      },
    ],
  },
  {
    id: "carmen-miranda",
    locale: "pt-BR",
    displayName: "Carmen Miranda",
    acceptedNames: ["carmen miranda", "carmen", "pequena notavel"],
    shortBio: "Cantora e atriz",
    years: "1909–1955",
    portraitUrl: null,
    clues: [
      {
        text: "Antes da fama, aprendeu a fazer chapéus trabalhando numa loja no centro do Rio.",
        sources: [ENC_CARMEN, USP_CARMEN, ALESP_CARMEN],
      },
      {
        text: "Em 1945, foi a mulher mais bem paga dos Estados Unidos.",
        sources: [ENC_CARMEN, ALESP_CARMEN],
      },
      {
        text: "Nasceu em Portugal, em 1909, e veio para o Brasil ainda bebê.",
        sources: [ENC_CARMEN, ALESP_CARMEN, USP_CARMEN],
      },
      {
        text: "Em 1930, gravou Taí (Pra Você Gostar de Mim), o disco mais vendido do ano no Brasil.",
        sources: [ENC_CARMEN, ALESP_CARMEN],
      },
      {
        text: "Em 1939, foi contratada para um musical da Broadway e depois fez vários filmes em Hollywood.",
        sources: [ENC_CARMEN, ALESP_CARMEN],
      },
      {
        text: "Ficou famosa no mundo todo cantando com turbantes enfeitados com frutas.",
        sources: [ENC_CARMEN, USP_CARMEN],
      },
    ],
  },
  {
    id: "nelson-mandela",
    locale: "pt-BR",
    displayName: "Nelson Mandela",
    acceptedNames: ["nelson mandela", "mandela", "madiba", "nelson rolihlahla mandela"],
    shortBio: "Líder político",
    years: "1918–2013",
    portraitUrl: null,
    clues: [
      {
        text: "Ganhou de uma professora da escola primária o nome inglês pelo qual o mundo o conheceu.",
        sources: [FUNDACAO_MANDELA, CIDOB_MANDELA],
      },
      {
        text: "Em 1952, abriu com um colega um dos primeiros escritórios de advocacia de juristas negros do seu país.",
        sources: [FUNDACAO_MANDELA, CIDOB_MANDELA],
      },
      {
        text: "Nasceu em 1918, numa aldeia onde o pai era conselheiro principal do rei do povo thembu.",
        sources: [FUNDACAO_MANDELA, CIDOB_MANDELA],
      },
      {
        text: "Condenado à prisão perpétua em 1964, passou os 18 anos seguintes numa prisão numa ilha perto da Cidade do Cabo.",
        sources: [CIDOB_MANDELA, FUNDACAO_MANDELA],
      },
      {
        text: "Em 1993, dividiu o Nobel da Paz com o presidente que negociou com ele o fim do apartheid.",
        sources: [FUNDACAO_MANDELA, HISTORIA_MANDELA],
      },
      {
        text: "Depois de 27 anos preso, virou em 1994 o primeiro presidente negro da África do Sul.",
        sources: [HISTORIA_MANDELA, CIDOB_MANDELA],
      },
    ],
  },
  {
    id: "frida-kahlo",
    locale: "pt-BR",
    displayName: "Frida Kahlo",
    acceptedNames: ["frida kahlo", "frida", "kahlo"],
    shortBio: "Pintora",
    years: "1907–1954",
    portraitUrl: null,
    clues: [
      {
        text: "O pai, nascido na Alemanha, era fotógrafo e construiu a casa onde ela nasceu e morou boa parte da vida.",
        sources: [MUSEU_FRIDA, "https://visitmexico.com/en/destino/2116/museo-de-frida-kahlo"],
      },
      {
        text: "Em 1939, expôs em Paris a convite de André Breton e dos surrealistas.",
        sources: [POMPIDOU_FRIDA, "https://www.centrepompidou.fr/en/ressources/oeuvre/EaZN1kV"],
      },
      {
        text: "No mesmo ano, o governo francês comprou um de seus autorretratos, hoje no Centre Pompidou, em Paris.",
        sources: [MUSEU_FRIDA, "https://www.centrepompidou.fr/en/ressources/oeuvre/EaZN1kV"],
      },
      {
        text: "Nasceu em 1907 em Coyoacán, na Cidade do México, numa casa que virou museu em 1958.",
        sources: [
          MUSEU_FRIDA,
          NMWA_FRIDA,
          "https://mexicocity.cdmx.gob.mx/venues/frida-kahlo-museum-casa-azul/?lang=en",
        ],
      },
      {
        text: "Casou-se duas vezes com o muralista Diego Rivera.",
        sources: [MUSEU_FRIDA, NMWA_FRIDA, POMPIDOU_FRIDA],
      },
      {
        text: "Pintora mexicana: das mais de 150 obras registradas, a maior parte são autorretratos.",
        sources: [MUSEU_FRIDA, "https://artsandculture.google.com/story/jwXxfGRb93QdIA"],
      },
    ],
  },
  {
    id: "pele",
    locale: "pt-BR",
    displayName: "Pelé",
    acceptedNames: ["pele", "edson arantes do nascimento", "edson arantes", "rei pele"],
    shortBio: "Jogador de futebol",
    years: "1940–2022",
    portraitUrl: null,
    clues: [
      {
        text: "Em 1995, virou ministro do Esporte no governo Fernando Henrique Cardoso.",
        sources: [ISTOE_PELE, ESPN_PELE],
      },
      {
        text: "Quando criança, detestava o apelido que os amigos lhe deram, que teria vindo do nome de um goleiro.",
        sources: [BIOGRAPHY_PELE, ESPN_PELE, ISTOE_PELE],
      },
      {
        text: "Nasceu em Três Corações, Minas Gerais, em 1940, filho de um jogador de futebol.",
        sources: [ESPN_PELE, BIOGRAPHY_PELE, ISTOE_PELE],
      },
      {
        text: "Encerrou a carreira nos Estados Unidos, jogando pelo New York Cosmos de 1975 a 1977.",
        sources: [ESPN_PELE, BIOGRAPHY_PELE],
      },
      {
        text: "Em 1969, marcou de pênalti contra o Vasco, no Maracanã, o milésimo gol da carreira.",
        sources: [
          ISTOE_PELE,
          ESPN_PELE,
          "https://www.folhape.com.br/esportes/confira-como-foi-o-milesimo-gol-de-pele/252050/",
        ],
      },
      {
        text: "É o único jogador a ganhar três Copas do Mundo: 1958, 1962 e 1970.",
        sources: [ISTOE_PELE, ESPN_PELE],
      },
    ],
  },
  {
    id: "charlie-chaplin",
    locale: "pt-BR",
    displayName: "Charlie Chaplin",
    acceptedNames: ["charlie chaplin", "chaplin", "charles chaplin", "charles spencer chaplin", "carlitos"],
    shortBio: "Ator e cineasta",
    years: "1889–1977",
    portraitUrl: null,
    clues: [
      {
        text: "Em 1952, viajou para a Europa e teve a volta aos Estados Unidos barrada. Passou o resto da vida na Suíça.",
        sources: ["https://abajournal.com/magazine/article/1952_charlie_chaplin_exile", ENC_CHAPLIN, BIOGRAPHY_CHAPLIN],
      },
      {
        text: "Em 1975, foi nomeado cavaleiro pela rainha Elizabeth II.",
        sources: [PBS_AE_CHAPLIN, ENC_CHAPLIN, BIOGRAPHY_CHAPLIN],
      },
      {
        text: "Nasceu em Londres, em 1889, filho de artistas de music hall, e chegou a viver num abrigo para pobres na infância.",
        sources: [PBS_AM_CHAPLIN, BIOGRAPHY_CHAPLIN],
      },
      {
        text: "Em 1919, fundou a United Artists com Mary Pickford, Douglas Fairbanks e D.W. Griffith.",
        sources: [PBS_AE_CHAPLIN, PBS_AM_CHAPLIN, ENC_CHAPLIN],
      },
      {
        text: "Em 1940, ridicularizou Hitler no filme O Grande Ditador.",
        sources: [PBS_AM_CHAPLIN, BIOGRAPHY_CHAPLIN],
      },
      {
        text: "Criou o Vagabundo, personagem do cinema mudo de chapéu-coco, bengala e bigodinho.",
        sources: [PBS_AE_CHAPLIN, BIOGRAPHY_CHAPLIN],
      },
    ],
  },
  {
    id: "elis-regina",
    locale: "pt-BR",
    displayName: "Elis Regina",
    acceptedNames: ["elis regina", "elis"],
    shortBio: "Cantora",
    years: "1945–1982",
    portraitUrl: null,
    clues: [
      {
        text: "Gravou o primeiro LP em 1961, ainda com 15 anos.",
        sources: [SESC_ELIS, USP_ELIS],
      },
      {
        text: "Nasceu em Porto Alegre, em 1945, e começou criança num programa de calouros do rádio. Aos 13, já era contratada de uma emissora.",
        sources: [SESC_ELIS, USP_ELIS],
      },
      {
        text: "Em 1965, venceu um festival da TV Excelsior cantando Arrastão, de Edu Lobo e Vinicius de Moraes.",
        sources: [USP_ELIS, SESC_ELIS],
      },
      {
        text: "De 1965 a 1968, apresentou O Fino da Bossa, na TV Record, ao lado de Jair Rodrigues.",
        sources: [USP_ELIS, SESC_ELIS],
      },
      {
        text: "Em 1974, gravou nos Estados Unidos um disco com Tom Jobim que inclui Águas de Março.",
        sources: [USP_ELIS, SESC_ELIS],
      },
      {
        text: "Eternizou Como Nossos Pais e O Bêbado e a Equilibrista, que virou símbolo da luta pela anistia.",
        sources: [SESC_ELIS, USP_ELIS],
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
  { date: "2026-11-25", personId: "albert-einstein" },
  { date: "2026-11-26", personId: "carmen-miranda" },
  { date: "2026-11-27", personId: "nelson-mandela" },
  { date: "2026-11-28", personId: "frida-kahlo" },
  { date: "2026-11-29", personId: "pele" },
  { date: "2026-11-30", personId: "charlie-chaplin" },
  { date: "2026-12-01", personId: "elis-regina" },
];

export function hasTodo(person: Person): boolean {
  return (
    person.shortBio.includes(TODO) ||
    person.years.includes(TODO) ||
    person.clues.some((c) => c.text.includes(TODO))
  );
}
