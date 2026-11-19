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

1. Na tela inicial, toque em **INICIAR**.
2. Escolha uma atividade do módulo (letras, números, vogais, consoantes ou o desafio).
3. Selecione os elementos corretos pedidos no topo da tela.
4. Acompanhe seus **acertos**, **erros** e **tentativas** no painel de pontos.
5. Ao concluir, avance para a próxima atividade.

## Módulos e atividades

- **Módulo 01 — Reconhecer letras**
  - Atividade 01 — Selecionar as letras
  - Atividade 02 — Selecionar os números
  - Atividade 03 — Selecionar as vogais
  - Atividade 04 — Selecionar as consoantes
  - Atividade 05 — Desafio com arrastar-e-soltar

> Novos módulos e atividades estão em desenvolvimento.

## Tecnologias

Front-end enxuto, focado em performance e experiência de uso, com um back-end .NET que concentra as regras que não podem ficar no cliente:

<p>
  <a href="https://github.com/SteveSilvas/dialo-game/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/SteveSilvas/dialo-game/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
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
- **[TypeScript 5.9](https://www.typescriptlang.org/)** — tipagem estática e segurança no código. Fixado na 5.9: a 7.x é o port nativo, ainda sem a API do compilador que `ts-jest` e `typescript-eslint` usam (ambos exigem `<7`).
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
- **[xUnit](https://xunit.net/)** + **[FluentAssertions](https://fluentassertions.com/)** — 75 testes de unidade e integração.
- **Google Identity Services** — login com Google validado no servidor (`Google.Apis.Auth`).

## Requisitos

### Para rodar o jogo (front-end)

- **[Node.js](https://nodejs.org/) 24 LTS ou 26 LTS** — recomendado Node 26 LTS
- **npm** 11+

O repositório traz um `.nvmrc` com a versão recomendada. Com
[nvm](https://github.com/nvm-sh/nvm) instalado, basta rodar `nvm use` na raiz do
projeto. O CI e o `Dockerfile` usam a mesma versão, então o que passa localmente
passa no build.

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

São 64 testes com Jest e Testing Library, cobrindo validações, sorteio, som,
navegação e o fluxo completo de cada atividade (acerto, erro, reinício e conclusão).

## API (`apps/api`)

A API guarda contas, catálogo e progresso. Ela roda separada do front: o jogo
continua funcionando sozinho, e o front passa a consumir a API quando a
sincronização estiver ligada.

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
  --startup-project src/DialoGame.Api

# aplica no banco configurado
dotnet ef database update \
  --project src/DialoGame.Infrastructure \
  --startup-project src/DialoGame.Api
```

Em produção, prefira rodar `database update` no pipeline com
`ApplyMigrationsOnStartup=false`: assim a API não altera schema sozinha a cada
restart.

### Testes da API

```sh
cd apps/api
dotnet test DialoGame.slnx
```

São 75 testes: unidade (cálculo de estrelas, política de senha, Argon2, JWT,
desbloqueio de módulo) e integração (auth, catálogo, progresso, rate limiting)
contra um Postgres real. Cada classe de teste cria um banco próprio e o remove ao
final.

### Endpoints

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Liveness/readiness, inclui o banco |
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

Copie `apps/api/.env.example` para começar. Nunca comite o `.env` real.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Verifica os tipos e gera a build de produção. |
| `npm run preview` | Pré-visualiza a build de produção. |
| `npm run lint` | Executa o ESLint em todo o projeto. |
| `npm test` | Executa a suíte de testes com Jest. |
| `npm run test:watch` | Executa os testes em modo observador. |
| `npm run audio:build` | Regera a música de fundo em Opus e MP3 a partir do master. |
| `npm run audio:opus` | Regera apenas o Opus (`public/audio/fundo.ogg`). |
| `npm run audio:mp3` | Regera apenas o MP3 de fallback (`public/audio/fundo.mp3`). |

Na API, os comandos ficam no `dotnet` (rode dentro de `apps/api`):

| Comando | Descrição |
| --- | --- |
| `dotnet run --project src/DialoGame.Api` | Sobe a API em `http://localhost:5099`. |
| `dotnet build DialoGame.slnx` | Compila a solução inteira. |
| `dotnet test DialoGame.slnx` | Executa os 75 testes de unidade e integração. |
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
public/
├── audio/                # Música de fundo comprimida, servida como estático
└── og-image.png          # Imagem do card de compartilhamento
src/
├── assets/               # Imagens, logos e efeitos sonoros curtos
├── components/           # Componentes reutilizáveis (Button, BoxRow, PanelPoints, ActivityGrid...)
├── Context/              # Estado global com Jotai
├── hooks/                # Hooks reutilizáveis (useActivityProgress)
├── pages/                # Telas e atividades do jogo
│   ├── modulo_01/        # Atividades do módulo 01
│   └── NotFound/         # Página para rotas não encontradas
├── routes/               # Definição das rotas da aplicação
├── utils/                # Funções auxiliares (validações, sons, geradores)
│   └── backgroundMusic.ts # Fontes da música de fundo (Opus + MP3)
├── index.css             # Tailwind + tema (paleta infantil) e estilos globais
├── App.tsx               # Tela inicial
└── main.tsx              # Ponto de entrada da aplicação
```

Na raiz ficam os arquivos de entrega do front: `vercel.json` (deploy no Vercel),
`Dockerfile` + `nginx.conf` + `docker-compose.yml` (deploy em container) e
`.github/workflows/ci.yml` (lint, testes e build dos dois runtimes).

## Performance do bundle

A música de fundo saiu do bundle: antes ela era importada em dois componentes e
embutida no build (`soudMr.mp3`, 2,24 MB — 88,7% do total). Agora é um arquivo
estático de `public/audio/`, baixado só depois do clique em **INICIAR**.

| Item | Antes | Depois |
| --- | --- | --- |
| Música de fundo | `soudMr.mp3` — 2.347.680 B (160 kbps, estéreo, 24 kHz) | Opus 653.932 B / MP3 587.396 B (mono, 40 kbps) |
| JS | 284,62 kB (92,73 kB gzip) | 286,17 kB (93,30 kB gzip) |
| CSS | 13,82 kB (3,52 kB gzip) | 15,41 kB (3,79 kB gzip) |
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

### Variável de build (opcional)

`VITE_SITE_URL` define o domínio usado nas tags `canonical` e Open Graph. Como o
`index.html` é estático, essas tags precisam de URL absoluta para o card aparecer
certo no WhatsApp, LinkedIn e X.

```sh
VITE_SITE_URL=https://dialo.seudominio.com.br
```

Defina no painel da plataforma antes do deploy. Sem ela (e fora do Vercel), as URLs
saem relativas (`/og-image.png`) — funciona no navegador, mas o preview do link fica
sem imagem em algumas redes sociais.

### API em produção

A API é um container .NET e precisa de um PostgreSQL gerenciado. O checklist mínimo:

1. Suba o Postgres e guarde a string de conexão.
2. Defina `ConnectionStrings__Default` e `Jwt__SigningKey` como segredos do
   ambiente (nunca no `appsettings.json`).
3. Rode `dotnet ef database update` no pipeline, com
   `ApplyMigrationsOnStartup=false`.
4. Libere o domínio do front em `Cors__AllowedOrigins__0` — o cookie de refresh é
   `SameSite=None`, então CORS com credenciais e HTTPS são obrigatórios.
5. Aponte o healthcheck do orquestrador para `GET /health`.

Sem `Jwt__SigningKey` com pelo menos 32 caracteres a API **não sobe**: a validação
acontece no startup, e não na primeira requisição.

## Roadmap

O Módulo 01 está completo e a API já entrega contas, catálogo e progresso no
servidor. O que falta é o front consumir esses endpoints: hoje o jogo ainda salva o
progresso apenas na sessão do navegador, enquanto a API está pronta e testada.

A expansão para uma plataforma de alfabetização — trilha com progressão entre
módulos, contas com JWT e login Google, progresso salvo em Postgres — está
detalhada em **[ROADMAP.md](./ROADMAP.md)**, com as issues de implementação abertas
no GitHub. O histórico de auditoria e refatorações fica em
[docs/historico-tecnico.md](./docs/historico-tecnico.md).

O raciocínio da escolha de backend — alternativas avaliadas, versão escolhida e
consequências aceitas — está em
[docs/adr/0001-stack-backend.md](./docs/adr/0001-stack-backend.md).

## Autor

**Steve Silva** — Desenvolvedor Full Stack na **Infotecdevs**, em São Paulo, Brasil.

Trabalho com desenvolvimento web de ponta a ponta: interface, estado, testes e
deploy. Este projeto reúne o que faço no dia a dia aplicado a um problema real de
educação infantil.

- GitHub: [@SteveSilvas](https://github.com/SteveSilvas)
- Outros projetos: [github.com/SteveSilvas?tab=repositories](https://github.com/SteveSilvas?tab=repositories)

Sugestões, correções e pull requests são bem-vindos. Se o DIALO GAME ajudar em
alguma sala de aula, me conte pelo GitHub.

## Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
