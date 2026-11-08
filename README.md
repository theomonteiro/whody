# whody?

Jogo diário de adivinhação de pessoas: todo dia uma pessoa, 6 pistas da mais obscura à mais óbvia. Quanto antes acertar, mais rara a figurinha; cada semana vira um álbum.

Fase 1: jogo do dia, resultado e álbum semanal, jogador anônimo (cookie). Grupos ficam pra Fase 2 (as tabelas já existem).

## Stack

- Next.js 16 (App Router) + TypeScript estrito, Tailwind 4 com os tokens em `app/globals.css`
- Postgres do Supabase, acessado só pelo servidor (`postgres.js` + `DATABASE_URL`)
- next-intl (só `pt-BR`, sem prefixo na URL), textos em `messages/pt-BR.json`
- next/og pras prévias de link, Vitest pros testes

## Rodar localmente

Precisa de Node 20+ e de um Postgres. O jeito mais simples é usar o próprio projeto do Supabase (pode ser um projeto separado pra desenvolvimento).

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env.local` e preencha `DATABASE_URL`:
   - No Supabase: **Project Settings → Database → Connection string**. Localmente, a "Session pooler" ou a conexão direta funcionam; na Vercel use a "Transaction pooler" (porta 6543).
   - Com Docker, também dá pra usar `npx supabase start` e a URL `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.
3. Crie as tabelas e carregue o conteúdo:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Suba o app em http://localhost:3000:
   ```bash
   npm run dev
   ```

Outros comandos: `npm test` (testes), `npm run typecheck`, `npm run lint`, `npm run build`.

Pra jogar de novo durante o desenvolvimento, apague o cookie `whody_pid` do navegador (vira outro jogador).

## Cadastrar pessoas

O conteúdo vive em [`content/people.ts`](content/people.ts). O banco é só uma cópia: edite o arquivo e rode `npm run db:seed` (pode rodar quantas vezes quiser).

1. Adicione a pessoa em `people`:
   - `id`: slug estável, ex. `"santos-dumont"`. Não mude depois de agendar.
   - `acceptedNames`: nome completo, nome artístico e apelidos. Acento e caixa não importam.
   - `shortBio`, `years`, `portraitUrl` (`null` usa o busto genérico em polígonos).
   - Retrato em polígonos: salve o SVG (3:4, `viewBox="0 0 300 400"`) em `public/portraits/<id>.svg` e use `portraitUrl: "/portraits/<id>.svg"`. Esses SVGs são desenhados inline e tingidos pela raridade: as cores devem misturar `var(--portrait-ink)` e `var(--portrait-paper)`, como nos de Santos Dumont e Machado de Assis. O tom de cada raridade fica em `lib/portrait.ts`. O retrato só chega ao navegador depois que o jogo acaba.
   - `clues`: exatamente 6, da mais obscura (1) à mais óbvia (6), cada uma com `sources`: a lista de links que comprovam a pista (aparecem em "Saiba mais" no resultado). Fato surpreendente, número ou citação pede 2 fontes independentes.
2. Agende em `schedule`: `{ date: "2026-11-14", personId: "..." }`. A data é no fuso de Brasília. O número do dia (#1, #2…) sai da data, contando a partir de `PUZZLE_EPOCH` em `lib/time.ts`.
3. Rode `npm run db:seed`, apontando `DATABASE_URL` pro banco certo (o de produção, pra valer no site).

Regras do seed:

- Pessoa com `TODO` na descrição, nos anos ou em alguma pista entra no banco (o corretor usa os nomes dela), mas o dia dela não é agendado. Sem pessoa agendada, o site mostra "Sem pessoa hoje".
- Um dia que já tem jogadas não troca de pessoa.
- Dias futuros que saírem do arquivo (e não têm jogadas) saem da agenda.
- O seed avisa quando o mesmo nome aceito pertence a duas pessoas: com esse nome, nenhuma das duas é aceita.

Curva das pistas: 1 e 2 são curiosidades obscuras; 3 e 4 dão contexto (época, área, país); a 5 é algo marcante mas não óbvio; a 6 é o que todo mundo conhece. Nada que entregue a pessoa antes da 6.

## Deploy na Vercel

1. Suba o repositório pro GitHub e importe na Vercel (framework detectado: Next.js).
2. Em **Settings → Environment Variables**, defina:
   - `DATABASE_URL`: a connection string do **Transaction pooler** do Supabase (porta 6543).
   - `NEXT_PUBLIC_SITE_URL` (opcional): a URL pública, ex. `https://whody.vercel.app`. Sem ela, o app usa a URL de produção da Vercel.
3. Rode as migrations e o seed contra o banco de produção, da sua máquina:
   ```bash
   DATABASE_URL="postgresql://..." npm run db:migrate
   DATABASE_URL="postgresql://..." npm run db:seed
   ```
4. Faça o deploy. A cada mudança em `content/people.ts`, rode o seed de novo contra produção.

## Como funciona

- **Telas** (`screenFor` em `lib/game/rules.ts`): sem pessoa agendada, "Sem pessoa hoje"; sem partida, a tela de início; partida em andamento, o jogo; partida terminada, o resultado. Abrir a tela de início não cria nada.
- **Anti-trapaça:** o navegador só recebe as pistas abertas; as fechadas chegam como `{ position, value, open: false }`. Na tela de início nenhuma pista é enviada. Nome, retrato e fontes só vêm depois que o jogo acaba. O conteúdo fica em `content/people.ts` (`server-only`) e no banco, que o app lê só no servidor. O RLS do Supabase está ligado sem políticas, então a API REST pública do Supabase não enxerga nada.
- **Cronômetro** (`lib/game/clock.ts`): cada pista tem `CLUE_SECONDS` segundos (25, em `lib/game/rules.ts`). Quem controla é o servidor: `plays.started_at` é a abertura da pista 1, e cada erro ou tempo esgotado (tentativa com `timeout: true`) abre a próxima. A cada requisição o servidor aplica os prazos vencidos, com `GRACE_MS` (1,5s) de tolerância pra latência. Sair ou recarregar não pausa; esgotar a 6ª pista termina com 0 pontos. O tempo total de resposta (desempate da Fase 2) continua sendo `finished_at − started_at`.
- **API:** `POST /api/play` ("Começar") cria a partida e abre a pista 1; é idempotente, então duas abas caem na mesma partida. `GET /api/play` devolve o estado com os prazos aplicados (o cliente chama quando a barra zera). `POST /api/guess` com `{ puzzleNumber, guess }` trava a jogada (`select … for update`), aplica os prazos, confere o palpite e grava; palpite atrasado vale pra pista em que o jogador realmente está.
- **Compartilhar:** 🟥 errou, ⬛ tempo esgotado, 🟩 acertou, ⬜ não abriu.
- **Corretor** (`lib/game/judge.ts`): normaliza (NFD, sem acento, minúsculas, só `[a-z0-9]`), mede Levenshtein até os nomes da resposta e de todas as outras pessoas; tolerância 0/1/2 pelo tamanho; acerto só dentro da tolerância e estritamente mais perto da resposta que de qualquer outra pessoa.
- **Dia:** vira à meia-noite de `America/Sao_Paulo` (`lib/time.ts`). Álbum de segunda a domingo.
- **Jogador:** id anônimo num cookie `httpOnly` criado em `proxy.ts`. Uma jogada por jogador e dia (`unique (player_id, puzzle_number)`).

## Estrutura

```
app/                  páginas (jogo, álbum, link compartilhado), API e imagens de prévia
components/           Game, Result, ShareCard, Sticker, Portrait, LeatherHeader…
content/people.ts     pessoas, pistas e agenda (fonte da verdade)
i18n/                 configuração do next-intl
lib/game/             regras, corretor, serviço do jogo (servidor) e tipos públicos
lib/time.ts           datas no fuso de Brasília
messages/pt-BR.json   todo texto de interface
scripts/              migrate e seed
supabase/migrations/  SQL das tabelas
```

## Outro idioma (depois)

Adicione o locale em `i18n/config.ts`, crie `messages/<locale>.json` e escolha o locale em `i18n/request.ts` (cookie ou `Accept-Language`). Pessoas e pistas já têm campo `locale` no banco.
