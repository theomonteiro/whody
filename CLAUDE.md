# Whody

Jogo diário de adivinhação: todo dia uma pessoa, 6 pistas da mais obscura (1) à mais óbvia (6). Feito pra um grupo de amigos, só em português por enquanto. Este arquivo é a fonte da verdade das regras. Se alguma decisão mudar, atualize aqui.

## Regras do jogo

- Uma pessoa por dia, igual pra todos. O dia vira à meia-noite de America/Sao_Paulo.
- Tela de início aparece só pra quem ainda não começou o dia. Quem começou e não terminou vai direto pro jogo; quem terminou vai direto pro resultado. Abrir a tela não inicia nada: só o botão "Começar".
- Cada pista tem 25 segundos (constante CLUE_SECONDS). Errar ou esgotar o tempo abre a próxima pista. Sair ou recarregar não pausa.
- Pontos pela pista do acerto: 100, 80, 60, 40, 20, 5. Errar as 6 = 0.
- Figurinha pela mesma pista: Diamante, Platina, Ouro, Prata, Bronze, Comum. 0 pontos = espaço vazio.
- Álbum semanal de segunda a domingo, 7 espaços, até 700 pts: 601–700 Diamante, 501–600 Platina, 401–500 Ouro, 301–400 Prata, 201–300 Bronze, 0–200 Comum. Exatamente 700 = Diamante com estrela.
- Streak = dias seguidos jogados (mesmo errando tudo). Hoje ainda não jogado não quebra a sequência.
- Palpite repetido que já foi errado não conta como novo erro.
- Resultado compartilhável: "whody #N", 6 quadrados (erro, tempo esgotado, acerto, não aberta), pontos e raridade. Nunca o nome da pessoa.

## Corretor (lib/game/judge.ts)

Normaliza (NFD, sem acento, minúsculas, só [a-z0-9] e espaço). Levenshtein do palpite contra os nomes aceitos da resposta e de todas as outras pessoas do banco. Tolerância pelo tamanho do palpite: até 5 = 0, 6–10 = 1, mais de 10 = 2. Acerto só se estiver dentro da tolerância E mais perto da resposta que de qualquer outra pessoa. Sem autocomplete.

## Anti-trapaça (inegociável)

- O cliente nunca recebe pista fechada, nome, retrato ou fontes antes do jogador terminar. Pistas fechadas chegam só como { position, value, open: false }.
- Palpites, tempo e pontos são decididos no servidor (lib/game/service.ts). O servidor guarda quando cada pista abriu e calcula a pista atual a cada requisição (1,5s de tolerância).
- Conteúdo só no servidor (server-only). Telas de grupo e imagens de compartilhamento nunca mostram o nome da pessoa do dia.

## Stack e infraestrutura

- Next.js (App Router) + TypeScript estrito, Tailwind com os tokens como variáveis CSS, Vitest.
- Banco: Postgres do Supabase via DATABASE_URL (sem supabase-js pro jogo). RLS ligado sem políticas. A Data API do Supabase está DESLIGADA.
- Local: Session pooler (porta 5432). Vercel: Transaction pooler (porta 6543), prepared statements desligados, funções em gru1 (São Paulo, fixado em vercel.json). Banco em sa-east-1.
- Testes que escrevem no banco (migrations novas, contas, grupos, partidas de teste) rodam num banco de desenvolvimento (outro projeto Supabase ou Postgres local), nunca no de produção. Migration nova só vai pra produção com aprovação do Theo.
- Migrations em supabase/migrations. `npm run db:migrate` e `npm run db:seed`. Sempre rodar a migration ANTES do deploy que depende dela.
- i18n com next-intl. Todo texto de interface em messages/pt-BR.json, nada escrito direto nos componentes. Pistas e nomes têm campo de idioma.
- Deploy automático na Vercel a cada push na main. Trabalhe numa branch por tarefa e faça merge na main no fim.

## Conteúdo

- Pessoas, pistas, nomes aceitos, fontes (source_urls, lista por pista) e agenda em content/people.ts. Depois de editar: `npm run db:seed` e push.
- Curva: 1–2 curiosidades obscuras, 3–4 contexto, 5 marcante mas não óbvia, 6 o fato ou frase famosa. Nada entrega antes da 6. Nunca inventar fatos: toda pista tem fonte confiável.
- Pra pesquisar pessoas novas, use a skill whody-pessoa.

## Retratos

- SVG low-poly 300×400 em public/portraits/<slug>.svg, gerado por `npm run portrait -- foto.jpg slug --zoom 1.25` (scripts/portrait.mjs; ajuste --eq de 0 a 1, --points e --seed). Depois, `portraitUrl: "/portraits/<slug>.svg"` em content/people.ts e `npm run db:seed`.
- O SVG é renderizado inline (components/Portrait.tsx) e pinta com --portrait-ink e --portrait-paper por raridade (lib/portrait.ts): Diamante #2F4A55/#DDF1F4, Platina #33404F/#DDE4EC, Ouro #5A4214/#F6E7BE, Prata #3E4248/#E4E6E9, Bronze #5A3420/#F0D9C6, Comum #4A3F36/#ECE5D7. Sem retrato, usa o busto genérico.

## Visual

Álbum de figurinhas com couro e scrapbook, mas limpo: um detalhe artesanal por tela.

- Cores: papel #F4EDE0 com pontilhado #DCCFB6 a cada 16px; couro #5A3925 (só no cabeçalho, com costura tracejada dourada); dourado #E9C988; tinta #241C17; tinta clara #6B5B4E; vermelho #B8341F (botão principal, números das pistas); ficha #FFFDF8 com margem #E3A6A0; linhas #E2D6C0; verde #3E8E5E.
- Fontes: Bricolage Grotesque 800 (títulos, números grandes), Courier Prime (pistas, palpite, rótulos), Caveat (no máximo uma anotação por tela), Inter (interface).
- Molduras das figurinhas: Diamante holográfico; Platina, Ouro, Prata, Bronze metálicos com brilho diagonal; Comum papel.
- Mobile first (390px); no desktop, coluna central de até 480px. Contraste ≥ 4,5:1, toque ≥ 44px.

## Fases

1. Feita: jogo do dia, cronômetro, tela de início, figurinha e álbum, compartilhamento, retratos.
2. Agora: login, grupos com convite, rankings (diário, semanal, mensal, todo período), streak e desempate, coleção de álbuns.
3. Depois: tela de admin de pistas, mais retratos.
4. Depois: segunda língua, Whody Anime.
