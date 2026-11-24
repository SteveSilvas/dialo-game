# DIALO GAME

### Aprender brincando: alfabetização infantil com jogos interativos

<p align="center">
  <img src="https://github.com/SteveSilvas/dialo-game/blob/master/src/assets/logo.png?raw=true" alt="DIALO GAME" width="280" />
</p>

<p align="center">
  <strong>Jogo educativo que transforma a alfabetização em uma aventura divertida e acessível para crianças.</strong>
</p>

---

## Sobre o projeto

**DIALO GAME** é um jogo educativo desenvolvido para apoiar a alfabetização de crianças por meio de atividades lúdicas e interativas. A criança aprende reconhecendo letras, vogais, consoantes, números e símbolos enquanto ouve sons, acumula pontos e avança por desafios — tudo em uma interface colorida, pensada para o público infantil.

O projeto nasceu da necessidade real de tornar o aprendizado mais leve e envolvente, unindo som, movimento e feedback visual imediato para manter a atenção e a motivação da criança durante o estudo.

Hoje o repositório tem duas partes: o **jogo** (Vite + React + TypeScript, publicado no Vercel) e a **API** (`apps/api`, .NET 10 + EF Core + PostgreSQL) que guarda contas, catálogo e progresso. O jogo funciona sozinho; a API é o que permite à criança continuar de onde parou em outro aparelho.

## Por que o DIALO GAME?

- **Aprendizado ativo** — a criança aprende fazendo, não apenas assistindo.
- **Estímulo multissensorial** — som, cor, imagem e interação no mesmo exercício.
- **Feedback imediato** — acertos e erros são reconhecidos na hora, com sons e contagem de pontos.
- **Progressão clara** — módulos e atividades organizados em uma jornada de dificuldade crescente.
- **Feito para crianças** — interface simples, botões grandes e cores vivas.
- **Sem barreira de entrada** — a criança joga na hora, sem cadastro. A conta é
  opcional e serve para levar o progresso de um aparelho para outro.
- **Progresso que não se perde** — estrelas e atividades concluídas ficam salvas.
  Sem conta, no próprio aparelho; com conta, no servidor.

## Habilidades desenvolvidas

| Habilidade | Como é trabalhada |
| --- | --- |
| **Reconhecimento de letras** | Seleção de letras em meio a símbolos e números. |
| **Vogais e consoantes** | Classificação e identificação de vogais e consoantes. |
| **Reconhecimento de números** | Separação de números em listas com símbolos. |
| **Escuta ativa** | Sons de acerto, erro e clique reforçam cada ação. |
| **Coordenação motora** | Interações de clique e arrastar-e-soltar. |
| **Memória e atenção** | Atividades que exigem concentração e repetição. |

## Como jogar

1. Na tela inicial, toque em **INICIAR** (na volta, o botão vira **CONTINUAR** e leva
   direto à atividade onde a criança parou).
2. Escolha uma atividade do módulo (letras, números, vogais, consoantes ou o desafio).
3. Selecione os elementos corretos pedidos no topo da tela.
4. Acompanhe seus **acertos**, **erros** e **tentativas** no painel de pontos.
5. Ao concluir, avance para a próxima atividade.

O cadastro é opcional. Quem entra com uma conta leva o progresso para outro
aparelho; quem joga como convidado tem o progresso guardado no navegador e pode
importá-lo depois, ao criar a conta.

### Rotas

| Rota | Tela |
| --- | --- |
| `/` | Início, com o resumo do progresso |
| `/trilha` | Trilha de módulos e atividades |
| `/modulo-01` | Home do módulo 01 |
| `/modulo-01/atividade-01` … `-05` | Atividades do módulo 01 |
| `/modulo-01/conclusao` | Conclusão do módulo 01 |
| `/modulo/:moduleSlug` | Home de um módulo novo, sem rota própria |
| `/modulo/:moduleSlug/:activitySlug` | Atividade de um módulo novo, escolhida pelo `type` |
| `/modulo/:moduleSlug/conclusao` | Conclusão de um módulo novo |
| `/entrar` | Login e cadastro |
| `*` | Página não encontrada |

As URLs ficam em `src/utils/paths.ts`, fonte única usada pela trilha, pela home do
módulo e pela conclusão. Um módulo é considerado jogável quando tem ao menos uma
atividade que o front sabe desenhar; módulo sem nenhuma aparece como **EM BREVE**
em vez de virar link, para a criança não cair num 404. Essa checagem é derivada do
`configJson` da atividade (`src/utils/activityConfig.ts`), e não de uma lista fixa
de módulos — a lista antiga precisava ser lembrada a cada módulo novo.

## Módulos e atividades

- **Módulo 01 — Reconhecer símbolos** (telas escritas à mão)
  - Atividade 01 — Selecionar as letras
  - Atividade 02 — Selecionar os números
  - Atividade 03 — Selecionar as vogais
  - Atividade 04 — Selecionar as consoantes
  - Atividade 05 — Desafio das consoantes (arrastar-e-soltar)
- **Módulo 02 — Sons das letras** (tela genérica, com fala)
  - Atividade 01 — Mesmo som inicial (`BOLA` → `BALA`)
  - Atividade 02 — Outro som inicial (`SAPO` → `SINO`)
  - Atividade 03 — Qual rima? (`GATO` → `PATO`)
  - Atividade 04 — Outra rima (`RATO` → `GATO`)
  - Atividade 05 — Mesmo som final (`CASA` → `ROSA`)
- **Módulo 03 — Sílabas** (tela genérica)
  - Atividade 01 — Junte as sílabas (`BA` + `LA` = `BALA`)
  - Atividade 02 — Três sílabas (`BANANA`)
  - Atividade 03 — Palavra de quatro sílabas (`BORBOLETA`)
  - Atividade 04 — Sílabas com acento (`PÁSSARO`)
  - Atividade 05 — Palavra comprida (`JACARÉ`)
- **Módulo 04 — Formar palavras** (tela genérica, com fala)
  - Atividade 01 — A primeira sílaba (`JA`_`NELA`, 3 sílabas)
  - Atividade 02 — A sílaba do meio (`SA`_`PA`_`TO`, 3 sílabas)
  - Atividade 03 — A última sílaba (`CA`_`VA`_`LO`, 3 sílabas)
  - Atividade 04 — Palavra de duas sílabas (`VE`_`LA`)
  - Atividade 05 — Palavra de quatro sílabas (`TAR`_`TA`_`RU`_`GA`)

  Os distratores diferem só na vogal (`LO`/`LA`/`LE`), e cada atividade muda a
  posição escondida ou a extensão da palavra — sem isso a criança só troca o
  item e não muda a tarefa. Nenhuma palavra repete as dos módulos 02 e 03.

### O áudio do módulo 02

O módulo depende de som para existir: quem ainda não lê não consegue resolver
"qual figura começa com o mesmo som" a partir de texto. A solução foi a **Web
Speech API** (`src/utils/speech.ts`), que pronuncia a palavra-alvo com a voz do
próprio sistema — não há gravação nem serviço externo.

O que isso resolve e o que não resolve:

- **Resolve** a dependência de infraestrutura. Nenhum arquivo de áudio para gravar,
  hospedar ou versionar, e o catálogo não precisa de um campo de mídia.
- **Não resolve** a revisão de pronúncia. A voz varia por sistema operacional, e
  uma palavra pode sair com sotaque ou entonação estranha. Por isso o enunciado
  **também aparece escrito** e a atividade nunca depende só do som.
- **Degrada com honestidade.** Sem `speechSynthesis` no navegador, o botão de ouvir
  fica desabilitado com o aviso "este aparelho não tem voz instalada" e a criança
  segue pelo texto — em vez de um botão que não faz nada.
- **Respeita o botão de som.** O controle do cabeçalho vale para todo o áudio:
  com ele desligado, a fala automática não acontece. Tocar em ouvir religa o som
  em vez de ficar inerte, porque aqui a palavra falada é o exercício — não
  ambiência. O mesmo vale para os efeitos de clique, acerto e erro.

> **Ponto de atenção para educador.** O TTS foi escolhido para destravar o módulo,
> não como substituto de gravação revisada. Se a pronúncia de alguma palavra sair
> ruim no aparelho usado em sala, trocar por áudio gravado é a correção — o
> componente isola a chamada de fala justamente para permitir essa troca.

> As atividades dos módulos 02, 03 e 04 ainda **não foram revisadas por educador**
> — é o pré-requisito registrado nas issues #29, #30 e #31 antes de usar em sala de
> aula. O código está pronto e testado; o conteúdo é um ponto de partida.

## Como uma atividade é montada

A tela de atividade é **dirigida por dados**: a API manda `type` e `configJson`, e o
front escolhe o componente.

```jsonc
// GET /catalog → activities[0]
{
  "slug": "modulo-03-atividade-01",
  "type": "buildWord",
  "configJson": "{\"word\":\"BALA\",\"syllables\":[\"BA\",\"LA\"]}"
}
```

`src/utils/activityConfig.ts` valida a config e devolve um tipo conhecido, ou
`unsupported`. A validação não é zelo excessivo: sílabas que não remontam a palavra
produziriam uma atividade **impossível de concluir**, e é melhor marcá-la
indisponível do que deixar a criança presa.

Para adicionar um tipo novo, são três passos: um parser em `activityConfig.ts`, o
componente da atividade e uma entrada em `RENDERABLE_KINDS`. Enquanto o componente
não existir, a atividade fica visível no catálogo mas não vira link.

## Tecnologias

Front-end enxuto, focado em performance e experiência de uso, com um back-end .NET que concentra as regras que não podem ficar no cliente:

<p>
  <a href="https://github.com/SteveSilvas/dialo-game/actions/workflows/ci.yml"><img alt="CI Front" src="https://github.com/SteveSilvas/dialo-game/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/SteveSilvas/dialo-game/actions/workflows/api.yml"><img alt="CI API" src="https://github.com/SteveSilvas/dialo-game/actions/workflows/api.yml/badge.svg" /></a>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="React Router" src="https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white" />
  <img alt="Jotai" src="https://img.shields.io/badge/Jotai-3-000000?logo=jotai&logoColor=white" />
  <img alt="Jest" src="https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white" />
  <img alt="ESLint" src="https://img.shields.io/badge/ESLint-10-4B32C3?logo=eslint&logoColor=white" />
  <img alt=".NET" src="https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white" />
  <img alt="xUnit" src="https://img.shields.io/badge/xUnit-2.9-512BD4?logo=xunit&logoColor=white" />
</p>

### Front-end

- **[React 19](https://react.dev/)** — biblioteca para construção de interfaces.
- **[TypeScript 6.0](https://www.typescriptlang.org/)** — tipagem estática e segurança no código. Fixado na 6.0: a 7.x é o port nativo, ainda sem a API do compilador que `ts-jest` e `typescript-eslint` usam (ambos exigem `<7`).
- **[Vite](https://vite.dev/)** — build e servidor de desenvolvimento ultrarrápidos.
- **[Tailwind CSS](https://tailwindcss.com/)** — utilitários de estilo e responsividade.
- **[React Router](https://reactrouter.com/)** — navegação entre módulos e atividades.
- **[Jotai](https://jotai.org/)** — gerenciamento de estado global leve.
- **[React Icons](https://react-icons.github.io/react-icons/)** — ícones da interface.
- **[Jest](https://jestjs.io/)** + **[Testing Library](https://testing-library.com/)** — testes automatizados.
- **[ESLint](https://eslint.org/)** — padronização e qualidade do código.

### Back-end (`apps/api`)

- **[.NET 10 (LTS)](https://dotnet.microsoft.com/)** — runtime com suporte até novembro de 2028.
- **[ASP.NET Core](https://learn.microsoft.com/aspnet/core/)** — API HTTP com controllers e `ProblemDetails`.
- **[EF Core](https://learn.microsoft.com/ef/core/)** — ORM *code first* com migrations versionadas.
- **[PostgreSQL 17](https://www.postgresql.org/)** — banco relacional, com `jsonb` para o conteúdo das atividades.
- **[Npgsql](https://www.npgsql.org/)** — driver e provider EF Core para PostgreSQL.
- **JWT + Argon2id** — access token curto e refresh rotativo; senhas com Argon2id (`Konscious.Security.Cryptography`).
- **[Serilog](https://serilog.net/)** — log estruturado em JSON compacto, com resumo por requisição e máscara de dados sensíveis.
- **[xUnit](https://xunit.net/)** + **[FluentAssertions](https://fluentassertions.com/)** — 96 testes de unidade e integração.
- **[Playwright](https://playwright.dev/)** + **[axe-core](https://github.com/dequelabs/axe-core)** — E2E da trilha e acessibilidade.
- **Google Identity Services** — login com Google validado no servidor (`Google.Apis.Auth`).

## Requisitos

### Para rodar o jogo (front-end)

- **[Node.js](https://nodejs.org/) 26 LTS** (Lithium, hoje `26.13.1`) — Node 24 também
  funciona: todas as dependências declaram `>=24`
- **npm** 11+ — o npm que vem com o Node 26 já serve; o `12.x` também funciona

O repositório traz um `.nvmrc` com `26`. Com [nvm](https://github.com/nvm-sh/nvm)
instalado, basta rodar `nvm use` na raiz do projeto. O CI lê o mesmo `.nvmrc` e o
`Dockerfile` usa `node:26-alpine`, então o que passa localmente passa no build.

### Para rodar a API (`apps/api`)

- **[.NET SDK 10.0](https://dotnet.microsoft.com/download)** — `dotnet --version` deve mostrar `10.x`
- **[PostgreSQL 17](https://www.postgresql.org/download/)** — local ou via Docker
- **`dotnet-ef` 10** — instale como ferramenta global:

```sh
dotnet tool install --global dotnet-ef --version 10.0.15
```

## Começando

### Clone o repositório

```sh
git clone https://github.com/SteveSilvas/dialo-game.git
cd dialo-game
```

### Instale as dependências

```sh
npm install
```

### Inicie em modo de desenvolvimento

```sh
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173) no navegador.

### Gere a build de produção

```sh
npm run build
```

### Pré-visualize a build de produção

```sh
npm run preview
```

### Recompilar a música de fundo

A música de fundo vive em `public/audio/` (fora do bundle JS) e é gerada a partir
do master `audio-src/fundo-master.mp3`. Para regerar os dois formatos, é preciso ter
o **[ffmpeg](https://ffmpeg.org/)** instalado:

```sh
npm run audio:build
```

O script equivale a:

```sh
# Opus mono 40 kbps — primeira opção, ~654 kB
ffmpeg -y -hide_banner -loglevel error -i audio-src/fundo-master.mp3 \
  -map_metadata -1 -ac 1 -c:a libopus -b:a 40k -vbr on public/audio/fundo.ogg

# MP3 mono 40 kbps @ 24 kHz — fallback para navegadores sem Ogg/Opus, ~587 kB
ffmpeg -y -hide_banner -loglevel error -i audio-src/fundo-master.mp3 \
  -map_metadata -1 -ac 1 -c:a libmp3lame -b:a 40k -ar 24000 public/audio/fundo.mp3
```

O player (`src/components/layout/index.tsx`) declara as duas fontes em um `<audio>`
com `preload="none"` e `loop`; o navegador escolhe a primeira que souber decodificar
(Opus → MP3). O download só começa no gesto em **INICIAR**, o que também evita o
bloqueio de autoplay.

> Os arquivos em `public/audio/` são versionados: só rode `npm run audio:build`
> quando trocar o master ou os parâmetros de compressão.

### Verifique a qualidade do código

```sh
npm run lint
```

### Rode os testes

```sh
npm test
```

São 330 testes com Jest e Testing Library, cobrindo validações, sorteio, som
(inclusive o mudo), navegação, o fluxo completo de cada atividade (acerto, erro,
reinício e conclusão), o parser de `configJson` (incluindo config inconsistente)
e a integração com a API: cliente HTTP com renovação de token, contratos do
catálogo, progresso de convidado, fim de módulo e a tela de entrada.

### Rode os testes de ponta a ponta

```sh
npx playwright install chromium   # uma vez
npm run test:e2e
```

O Playwright sobe a API e o front construído por conta própria, contra um banco
`dialo_e2e` recriado a cada execução (é preciso um Postgres em `localhost:5432`;
`docker compose` em `apps/api` resolve). Os specs ficam em `e2e/` e cobrem o que
teste de componente não alcança: visitante que joga, cria conta e leva o
progresso junto; conclusão do módulo 01 liberando o 02 e mantendo o 03
bloqueado; o módulo 04 abrindo só depois do 03, recusando o distrator e
concluindo pela tela de fim de módulo; navegação entre atividades sem herdar
contadores da anterior; F5 em rota interna preservando a sessão; a trilha inteira
percorrida só com teclado; e a auditoria de acessibilidade (axe, WCAG 2.1 AA) nas
telas principais. São 26 testes. O CI roda essa suíte em PRs que tocam o front.

## API (`apps/api`)

A API guarda contas, catálogo e progresso. Ela roda separada do front, e o jogo
**já consome** esses endpoints: a trilha vem do `/catalog` e cada atividade
concluída é registrada no servidor. Se a API não responder, o jogo continua
jogável em modo convidado e guarda o progresso no navegador.

### Subir tudo com Docker

O caminho mais rápido é o `docker compose`, que sobe o Postgres e a API juntos:

```sh
cd apps/api
cp .env.example .env          # ajuste a senha e gere a chave do JWT
openssl rand -base64 48       # cole o resultado em Jwt__SigningKey
docker compose up --build
```

A API responde em [http://localhost:8081](http://localhost:8081) e o
`GET /health` deve devolver `Healthy`. O banco fica em um volume nomeado, então os
dados sobrevivem a `docker compose down`.

### Subir manualmente (Postgres já instalado)

```sh
cd apps/api
export ConnectionStrings__Default="Host=localhost;Port=5432;Database=dialo_game;Username=dialo;Password=dialo_dev"
export Jwt__SigningKey="$(openssl rand -base64 48)"
export ApplyMigrationsOnStartup=true

dotnet run --project src/DialoGame.Api
```

A API sobe em `http://localhost:5099` (definido em
`src/DialoGame.Api/Properties/launchSettings.json`). Com
`ApplyMigrationsOnStartup=true`, as migrations e o seed do catálogo são aplicados
no boot.

### Migrations

```sh
cd apps/api

# cria uma migration a partir de uma mudança no modelo
dotnet ef migrations add NomeDaMigration \
  --project src/DialoGame.Infrastructure \
  --startup-project src/DialoGame.Infrastructure

# aplica no banco configurado
dotnet ef database update \
  --project src/DialoGame.Infrastructure \
  --startup-project src/DialoGame.Infrastructure
```

O projeto de inicialização é a própria `DialoGame.Infrastructure`, e não a API:
o `DesignTimeDbContextFactory` mora lá, junto do pacote de design. A API não
referencia `Microsoft.EntityFrameworkCore.Design`, então usá-la como startup
project faz o `dotnet ef` falhar.

Em produção, prefira rodar `database update` no pipeline com
`ApplyMigrationsOnStartup=false`: assim a API não altera schema sozinha a cada
restart.

### Testes da API

```sh
cd apps/api
dotnet test DialoGame.slnx
```

São 96 testes: unidade (cálculo de estrelas, política de senha, Argon2, JWT,
desbloqueio de módulo e a máscara de dados sensíveis do log) e integração
(auth, catálogo, progresso, rate limiting e o log estruturado) contra um
Postgres real. Cada classe de teste cria um banco próprio e o remove ao
final.

### CI

São dois workflows, um por runtime, para que o resultado de cada um apareça
separado no README e no PR:

| Workflow | O que roda |
| --- | --- |
| `ci.yml` (front) | ESLint, Jest, build do Vite e E2E do Playwright em PRs que tocam o front. |
| `api.yml` (API) | `dotnet format`, build, `dotnet test`, migrations do zero e build da imagem Docker. |

No `api.yml`, o passo de migrations derruba o banco (`database drop`), aplica
tudo com `database update` e depois confere que nada ficou pendente. Um segundo
passo, `has-pending-model-changes`, reprova quando o modelo mudou sem uma
migration nova — o caso que passa no build e quebra no deploy.

Os dois usam cache: `setup-node` cuida do npm e `actions/cache` guarda
`~/.nuget/packages` com chave derivada dos `.csproj` e do `Directory.Build.props`.

**Bloquear merge com CI vermelho** não se faz no workflow: é configuração de
branch protection no repositório. Em **Settings → Branches**, adicione uma regra
para `master` com *Require status checks to pass before merging* e selecione os
checks `Lint, testes e build`, `E2E da trilha (Playwright)` e
`API .NET (format, build, testes e migrations)`. Isso exige permissão de admin —
o token de automação do bot recebe `403` na API de branch protection, então a
regra precisa ser criada no painel.

### Endpoints

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Liveness/readiness, inclui o banco |
| `GET` | `/metrics` | Bearer (token de scrape) | Latência por rota, taxa de erro e logins, em formato Prometheus |
| `GET` | `/catalog` | opcional | Módulos e atividades; com token, inclui o progresso |
| `POST` | `/auth/register` | — | Cria conta com username, email opcional e senha |
| `POST` | `/auth/login` | — | Login por username **ou** email |
| `POST` | `/auth/google` | — | Login com `idToken` do Google |
| `POST` | `/auth/refresh` | cookie | Rotaciona o refresh token |
| `POST` | `/auth/logout` | cookie | Revoga o refresh e limpa o cookie |
| `GET` | `/auth/me` | Bearer | Perfil do usuário autenticado |
| `GET` | `/progress` | Bearer | Progresso consolidado por módulo e atividade |
| `PUT` | `/progress/activities/{slug}` | Bearer | Registra o resultado de uma atividade |
| `POST` | `/progress/import` | Bearer | Mescla o progresso feito como convidado |

**O servidor decide o desbloqueio.** O front esconde o que está bloqueado, mas
quem valida é a API: gravar progresso em módulo bloqueado devolve `403`. As
estrelas também são calculadas no servidor, a partir da precisão, para que o
cliente não possa concedê-las a si mesmo.

**Modo convidado.** Quem não quer criar conta joga normalmente: o `GET /catalog`
responde sem progresso, as estrelas são calculadas no próprio navegador com a
mesma regra do servidor (`src/utils/scoring.ts`) e o resultado fica no
`localStorage`. Ao entrar ou criar conta, esse progresso é enviado para
`POST /progress/import` e o servidor fica com a melhor tentativa de cada
atividade. Por isso a conta é opcional, e não uma barreira na frente do jogo.

**Progresso com escrita otimista.** O resultado vale no aparelho antes de o
servidor responder: `src/state/progress.ts` grava no `localStorage` e publica o
novo estado em Jotai, e a trilha lê esse átomo — não há estado de progresso
paralelo em componente. O que ainda não subiu forma uma fila que
`useProgressSync` envia em segundo plano, uma atividade por vez. Falha de rede
interrompe a rodada sem perder nada e a fila volta sozinha, com espera
crescente, quando a conexão retorna. Um indicador discreto
(`src/components/SyncIndicator`) mostra "Salvando..." / "Salvo"; para quem joga
sem conta ele não aparece, porque não há para onde sincronizar.

### Variáveis de ambiente

Todas seguem o formato `Secao__Chave` do ASP.NET Core.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `ConnectionStrings__Default` | sim | String de conexão do PostgreSQL |
| `Jwt__SigningKey` | sim | Chave HS256, mínimo 32 caracteres |
| `Jwt__Issuer` / `Jwt__Audience` | não | Padrão: `dialo-game` / `dialo-game-web` |
| `Google__ClientId` | não | Sem ela, o login Google fica desativado |
| `Cors__AllowedOrigins__0` | não | Origem liberada; repita o índice para mais origens |
| `ApplyMigrationsOnStartup` | não | `true` aplica migrations e seed no boot |
| `Auth__RefreshCookieSecure` | não | `true` exige HTTPS no cookie de refresh |
| `RateLimiting__Enabled` | não | `false` desliga o limite de login/cadastro |
| `Logging__Structured__Enabled` | não | `false` desliga o log JSON e o resumo por requisição |
| `Metrics__Enabled` | não | `false` desliga a coleta e o `/metrics` |
| `Metrics__Token` | não | Token do scrape; **sem ele o `/metrics` não é publicado** |
| `Metrics__Path` | não | Rota do scrape (padrão: `/metrics`) |
| `Serilog__MinimumLevel__Default` | não | Nível mínimo do log (`Information` por padrão) |

Copie `apps/api/.env.example` para começar. Nunca comite o `.env` real.

### Log

Com `Logging__Structured__Enabled` ligado (o padrão), cada linha sai em JSON
compacto com `@t`, `@mt` e as propriedades da mensagem, e cada requisição deixa
um resumo com método, rota, status, duração e `RequestId`. Exceção não tratada
vira uma linha com rota, status 500 e o `RequestId` da requisição, para casar o
erro com o resumo dela.

O nível se configura em **`Serilog__MinimumLevel__*`**, não em
`Logging__LogLevel__*`: o Serilog substitui o provider padrão, então a seção
`Logging:LogLevel` não tem efeito. `SensitiveDataDestructuringPolicy` mascara
senha, token e e-mail antes de qualquer objeto chegar ao sink.

### Métricas

Com `Metrics__Enabled` ligado (o padrão) e `Metrics__Token` definido, o
`GET /metrics` responde no formato Prometheus/OpenMetrics. São três medições:

| Métrica | Tipo | Rótulos | Responde |
| --- | --- | --- | --- |
| `http_server_request_duration_seconds` | histograma | `http_route`, `http_response_status_code` | Latência por rota e por status |
| `dialo_http_errors_total` | contador | `route`, `status_code` | Taxa de erro 5xx |
| `dialo_auth_logins_total` | contador | `method`, `result` | Logins por senha e por Google |

O rótulo de rota é sempre o **template** (`/progress/activities/{slug}`), nunca o
caminho concreto: caminho bruto criaria uma série por URL inventada, que é
cardinalidade sem limite. O histograma de latência vem da instrumentação oficial
do ASP.NET Core; os dois contadores são do `Meter` próprio `DialoGame`.

```sh
curl -H "Authorization: Bearer $Metrics__Token" http://localhost:5099/metrics
```

**Logins por dia** saem da consulta, não de um rótulo de data — uma série por dia
cresceria para sempre:

```promql
# Sucessos nas últimas 24 h, por método
sum by (method) (increase(dialo_auth_logins_total{result="success"}[24h]))
```

O endpoint **não é publicado** sem `Metrics__Token`: aberto, ele entregaria o mapa
do tráfego (rotas, volume, taxa de erro) para qualquer um que o encontrasse. A
rota é servida antes da autenticação JWT, então o scrape não gera uma verificação
de token falha a cada coleta.

**O alerta não mora na API.** O código só publica números; quem decide que
"1% de erro por 10 min é ruim" é o coletor. As regras de exemplo (erro, p95 de
latência e API fora do ar) e o raciocínio completo estão no
[ADR 0002](./docs/adr/0002-metricas-e-alerta.md). A consequência é direta: sem
subir um Prometheus (ou VictoriaMetrics, ou Grafana Cloud) apontado para
`/metrics`, os números existem e ninguém é avisado.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Verifica os tipos e gera a build de produção. |
| `npm run preview` | Pré-visualiza a build de produção. |
| `npm run lint` | Executa o ESLint em todo o projeto. |
| `npm test` | Executa a suíte de testes com Jest. |
| `npm run test:watch` | Executa os testes em modo observador. |
| `npm run test:e2e` | Roda o E2E da trilha com Playwright (API + front). |
| `npm run test:e2e:ui` | Abre o E2E no modo interativo do Playwright. |
| `npm run test:e2e:report` | Abre o último relatório HTML do E2E. |
| `npm run audio:build` | Regera a música de fundo em Opus e MP3 a partir do master. |
| `npm run audio:opus` | Regera apenas o Opus (`public/audio/fundo.ogg`). |
| `npm run audio:mp3` | Regera apenas o MP3 de fallback (`public/audio/fundo.mp3`). |

Na API, os comandos ficam no `dotnet` (rode dentro de `apps/api`):

| Comando | Descrição |
| --- | --- |
| `dotnet run --project src/DialoGame.Api` | Sobe a API em `http://localhost:5099`. |
| `dotnet build DialoGame.slnx` | Compila a solução inteira. |
| `dotnet test DialoGame.slnx` | Executa os 96 testes de unidade e integração. |
| `dotnet format --verify-no-changes` | Confere a formatação (o CI reprova se falhar). |

## Estrutura do projeto

O front fica na raiz (é o app publicado no Vercel) e a API em `apps/api`.

```
apps/api/                 # API .NET 10
├── DialoGame.slnx        # Solução
├── Directory.Build.props # TFM e versões de pacote em um lugar só
├── Dockerfile            # Build em duas etapas (SDK → runtime)
├── docker-compose.yml    # API + PostgreSQL
├── .env.example          # Modelo das variáveis de ambiente
├── src/
│   ├── DialoGame.Api/            # Controllers, contratos, Program.cs
│   ├── DialoGame.Domain/         # Entidades e enums, sem dependências
│   └── DialoGame.Infrastructure/ # EF Core, migrations, serviços, segurança
└── tests/DialoGame.Tests/        # xUnit: unidade + integração

audio-src/                # Master da música de fundo (entrada do npm run audio:build)
e2e/                      # E2E com Playwright: specs e helpers (support/)
playwright.config.ts      # Sobe API + preview e roda a suíte E2E
public/
├── audio/                # Música de fundo comprimida, servida como estático
└── og-image.png          # Imagem do card de compartilhamento
src/
├── api/                  # Cliente HTTP e contratos da API (client, auth, catalog, types)
├── assets/               # Imagens, logos e efeitos sonoros curtos
├── components/           # Componentes reutilizáveis (Button, BoxRow, PanelPoints, ActivityGrid,
│                         #   BuildWordActivity — montagem de palavra dirigida por config)
├── Context/              # Átomos Jotai de som (SoundAtom)
├── hooks/                # Hooks (useActivityProgress, useCatalog, useModuleCompletion,
│                         #   useProgressHydration, useProgressSync, useSession, usePrefersReducedMotion)
├── pages/                # Telas e atividades do jogo
│   ├── atividade/        # Atividade genérica: escolhe o componente pelo type da API
│   ├── entrar/           # Login e cadastro
│   ├── modulo/           # Home e conclusão genéricas de módulo
│   ├── modulo_01/        # Atividades do módulo 01
│   ├── trilha/           # Trilha com a progressão entre módulos
│   └── NotFound/         # Página para rotas não encontradas
├── routes/               # Definição das rotas da aplicação
├── state/                # Sessão, progresso (átomos Jotai) e fila de convidado no localStorage
├── utils/                # Funções auxiliares (validações, sons, pontuação, rotas)
│   ├── activityConfig.ts # Parser do configJson e checagem do que o front desenha
│   ├── paths.ts          # URLs da trilha (fonte única das rotas)
│   └── backgroundMusic.ts # Fontes da música de fundo (Opus + MP3)
├── index.css             # Tailwind + tema (paleta infantil) e estilos globais
├── App.tsx               # Tela inicial
└── main.tsx              # Ponto de entrada da aplicação
```

Na raiz ficam os arquivos de entrega do front: `vercel.json` (deploy no Vercel),
`Dockerfile` + `nginx.conf` + `docker-compose.yml` (deploy em container) e
`.github/workflows/` (lint, testes e build dos dois runtimes).

## Performance do bundle

A música de fundo saiu do bundle: antes ela era importada em dois componentes e
embutida no build (`soudMr.mp3`, 2,24 MB — 88,7% do total). Agora é um arquivo
estático de `public/audio/`, baixado só depois do clique em **INICIAR**.

| Item | Antes | Depois |
| --- | --- | --- |
| Música de fundo | `soudMr.mp3` — 2.347.680 B (160 kbps, estéreo, 24 kHz) | Opus 653.932 B / MP3 587.396 B (mono, 40 kbps) |
| JS | 284,62 kB (92,73 kB gzip) | 338,14 kB (108,08 kB gzip) |
| CSS | 13,82 kB (3,52 kB gzip) | 27,74 kB (6,04 kB gzip) |
| Baixado na home antes do gesto | 2,24 MB de áudio | 0 B de áudio |

O navegador só pede um dos dois arquivos: ~654 kB no Opus, ~587 kB no MP3.

## Deploy

A aplicação é um SPA estático (Vite). O ponto crítico de qualquer hospedagem é o
*fallback* de SPA: sem ele, recarregar `/modulo-01/atividade-03` devolve 404, porque
não existe um arquivo nesse caminho — o React Router resolve a rota no cliente.
Cada plataforma abaixo já está configurada no repositório.

### Vercel (produção atual)

O site está em **[dialo-game.vercel.app](https://dialo-game.vercel.app)**. O `vercel.json`
traz o rewrite que manda qualquer rota para o `index.html`, além dos cabeçalhos de
cache (assets com hash por 1 ano, áudio por 7 dias) e de segurança.

1. Importe o repositório em [vercel.com/new](https://vercel.com/new).
2. O Vercel detecta o Vite sozinho. Não é preciso configurar comando nem diretório.
3. Cada `git push` no `master` publica em produção; cada PR ganha uma URL de preview.

Não é necessário definir `VITE_SITE_URL`: em produção o Vercel expõe
`VERCEL_PROJECT_PRODUCTION_URL` e o `vite.config.ts` monta a URL absoluta a partir
dela. Para usar domínio próprio, defina `VITE_SITE_URL` nas *Environment Variables*
do projeto — ela tem prioridade.

### Coolify (container)

O repositório também roda em container: o `Dockerfile` faz o build em duas etapas
(Node → nginx) e o `nginx.conf` inclui o mesmo *fallback* de SPA.

```sh
docker compose up --build
```

Acesse [http://localhost:8080](http://localhost:8080).

Para hospedar no Coolify:

1. **New Resource → Application → Public Repository** e aponte para
   `https://github.com/SteveSilvas/dialo-game` (branch `master`).
2. Em **Build Pack**, escolha **Dockerfile** (o `docker-compose.yml` também é
   detectado, se preferir Compose).
3. **Ports Exposes**: `80` (a imagem serve o nginx nessa porta).
4. **Domain**: informe o domínio desejado. O Coolify emite o certificado TLS
   automaticamente.
5. Em **Environment Variables**, defina `VITE_SITE_URL` com o domínio final — aqui
   não existe a variável do Vercel, então sem ela as tags de Open Graph saem
   relativas e o card do link fica sem imagem.

### Variáveis de build

`VITE_SITE_URL` define o domínio usado nas tags `canonical` e Open Graph. Como o
`index.html` é estático, essas tags precisam de URL absoluta para o card aparecer
certo no WhatsApp, LinkedIn e X.

```sh
VITE_SITE_URL=https://dialo.seudominio.com.br
```

Defina no painel da plataforma antes do deploy. Sem ela (e fora do Vercel), as URLs
saem relativas (`/og-image.png`) — funciona no navegador, mas o preview do link fica
sem imagem em algumas redes sociais.

`VITE_API_URL` aponta para a API. Sem ela, o front usa `http://localhost:5099`
em desenvolvimento e a própria origem em produção. Como a API fica em outro
domínio no deploy, defina-a lá — e libere o domínio do front em
`Cors__AllowedOrigins__0`, senão o cookie de refresh não é aceito.

```sh
VITE_API_URL=https://api.dialo.seudominio.com.br
```

`VITE_GOOGLE_CLIENT_ID` habilita o botão "Entrar com Google". Precisa ser o
**mesmo** client id configurado em `Google__ClientId` na API: o front recebe o
`idToken` do Google e a API valida a assinatura contra esse id. Sem a variável, o
botão simplesmente não aparece e o login por senha continua funcionando.

```sh
VITE_GOOGLE_CLIENT_ID=000000000000-abcdefg.apps.googleusercontent.com
```

No Google Cloud Console, cadastre a origem do front em *Authorized JavaScript
origins* (`http://localhost:5173` e o domínio de produção).

Todas são lidas em tempo de build (veja `define` no `vite.config.ts`), então mudar
o valor exige um novo deploy. O modelo está em `.env.example`.

### API em produção

A API é um container .NET e precisa de um PostgreSQL gerenciado. O checklist mínimo:

1. Suba o Postgres e guarde a string de conexão.
2. Defina `ConnectionStrings__Default` e `Jwt__SigningKey` como segredos do
   ambiente (nunca no `appsettings.json`).
3. Rode `dotnet ef database update` no pipeline, com
   `ApplyMigrationsOnStartup=false`.
4. Libere o domínio do front em `Cors__AllowedOrigins__0` — com
   `Auth__RefreshCookieSecure=true` (o padrão) o cookie de refresh sai como
   `SameSite=None; Secure`, então CORS com credenciais e HTTPS são obrigatórios.
   Em HTTP local a flag vai para `false` e o cookie vira `SameSite=Lax`.
5. Aponte o healthcheck do orquestrador para `GET /health`.
6. Para métricas, defina `Metrics__Token` e aponte o coletor para `GET /metrics`
   com `Authorization: Bearer <token>`. Sem o token o endpoint não é publicado;
   sem coletor, os números existem e ninguém é avisado — as regras de alerta de
   exemplo estão no [ADR 0002](./docs/adr/0002-metricas-e-alerta.md).

Sem `Jwt__SigningKey` com pelo menos 32 caracteres a API **não sobe**: a validação
acontece no startup, e não na primeira requisição.

## Roadmap

O Módulo 01 está completo, com as cinco atividades e a tela de conclusão. A
trilha, as contas (JWT e Google) e o progresso em Postgres já estão no ar: cada
atividade concluída é registrada em `PUT /progress/activities/{slug}` e o
progresso de convidado é importado ao entrar na conta. Sem conta, ou sem rede, o
jogo segue funcionando e guarda o progresso no navegador.

O que falta é conteúdo. Os módulos 02 (sons), 03 (sílabas) e 04 (formar palavras)
já jogam de ponta a ponta pela tela genérica, e a trilha vai do 01 ao 04 sem beco
sem saída. O que resta da Fase 4 são os módulos 05 (ler frases) e 06 (escrever).
O bloqueio real é comum a todos: as atividades precisam ser definidas e revisadas
por um educador antes de virarem conteúdo de sala de aula.

O detalhamento está em **[ROADMAP.md](./ROADMAP.md)**, com as issues abertas no
GitHub. O histórico de auditoria e refatorações fica em
[docs/historico-tecnico.md](./docs/historico-tecnico.md).

O raciocínio da escolha de backend — alternativas avaliadas, versão escolhida e
consequências aceitas — está em
[docs/adr/0001-stack-backend.md](./docs/adr/0001-stack-backend.md).

### Dependências presas de propósito

`npm outdated` e `dotnet list package --outdated` mostram atualizações que **não
devem** ser aplicadas ainda. Cada uma tem um motivo verificado:

| Pacote | Versão usada | Versão "mais nova" | Por que não |
| --- | --- | --- | --- |
| TypeScript | `6.0.3` | `7.0.2` | `typescript-eslint` 8 exige `<6.1.0` e `ts-jest` exige `<7`; subir o TS quebra lint e testes |
| FluentAssertions | `7.2.2` | `8.11.0` | a 8.x passou a ser licenciada pela Xceed (comercial); a 7.2.2 é Apache-2.0 |
| EF Core, Npgsql, JwtBearer, `Microsoft.Extensions.*` | `10.0.x` | `11.0.0` | os pacotes 11.0.0 miram `net11.0` e não restauram em `net10.0` |
| `OpenTelemetry.Exporter.Prometheus.AspNetCore` | `1.21.0-beta.1` | — | nunca houve versão estável: todas as 39 publicadas são `-alpha`, `-beta` ou `-rc`. É o pacote oficial do projeto OpenTelemetry e a alternativa seria escrever o formato Prometheus à mão |

O Npgsql sobe dentro da linha 10 (`10.0.4`), assim como os patches da Microsoft
(`10.0.15`). Node 26.13.1 é o LTS atual; o `.nvmrc`, o CI e o `Dockerfile` estão
na mesma versão.

## Autor

**Steve Silva** — Desenvolvedor Full Stack na **Infotecdevs**, São Paulo, Brasil.

Trabalho com desenvolvimento de ponta a ponta: interface, estado, testes e
deploy. No dia a dia uso **React + TypeScript** no front e **.NET com C#** no
back — o mesmo par de stacks deste projeto, que é a razão de ele existir como
front e API no mesmo repositório.

Boa parte dos meus projetos é de ferramentas educacionais, e o DIALO GAME é o
que mais junta essas duas frentes: pedagogia de verdade no conteúdo e engenharia
no que sustenta a criança jogando (progresso que não se perde, acessibilidade,
funcionar offline).

- GitHub: [@SteveSilvas](https://github.com/SteveSilvas)
- Outros projetos: [github.com/SteveSilvas?tab=repositories](https://github.com/SteveSilvas?tab=repositories)

Sugestões, correções e pull requests são bem-vindos. Se o DIALO GAME ajudar em
alguma sala de aula, me conte pelo GitHub.

## Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
