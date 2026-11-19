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

Construído com um stack moderno de front-end, focado em performance e experiência de uso:

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
</p>

- **[React 19](https://react.dev/)** — biblioteca para construção de interfaces.
- **[TypeScript](https://www.typescriptlang.org/)** — tipagem estática e segurança no código.
- **[Vite](https://vite.dev/)** — build e servidor de desenvolvimento ultrarrápidos.
- **[Tailwind CSS](https://tailwindcss.com/)** — utilitários de estilo e responsividade.
- **[React Router](https://reactrouter.com/)** — navegação entre módulos e atividades.
- **[Jotai](https://jotai.org/)** — gerenciamento de estado global leve.
- **[React Icons](https://react-icons.github.io/react-icons/)** — ícones da interface.
- **[Jest](https://jestjs.io/)** + **[Testing Library](https://testing-library.com/)** — testes automatizados.
- **[ESLint](https://eslint.org/)** — padronização e qualidade do código.

## Requisitos

- **[Node.js](https://nodejs.org/) 20.19+** (ou 22.12+ / 24+) — recomendado Node 24 LTS
- **npm** 10+

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

## Estrutura do projeto

```
audio-src/                # Master da música de fundo (entrada do npm run audio:build)
public/
└── audio/                # Música de fundo comprimida, servida como estático
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

## Performance do bundle

A música de fundo saiu do bundle: antes ela era importada em dois componentes e
embutida no build (`soudMr.mp3`, 2,24 MB — 88,7% do total). Agora é um arquivo
estático de `public/audio/`, baixado só depois do clique em **INICIAR**.

| Item | Antes | Depois |
| --- | --- | --- |
| Música de fundo | `soudMr.mp3` — 2.347.680 B (160 kbps, estéreo, 24 kHz) | Opus 653.932 B / MP3 587.396 B (mono, 40 kbps) |
| JS | 284,62 kB (92,73 kB gzip) | 284,70 kB (92,80 kB gzip) |
| CSS | 13,82 kB (3,52 kB gzip) | 14,09 kB (3,56 kB gzip) |
| Baixado na home antes do gesto | 2,24 MB de áudio | 0 B de áudio |

O navegador só pede um dos dois arquivos: ~654 kB no Opus, ~587 kB no MP3.

## Deploy

A aplicação é um SPA estático (Vite) e já vem pronta para rodar em container. O
`Dockerfile` faz o build em duas etapas (Node → nginx) e o `nginx.conf` inclui o
*fallback* de SPA, essencial para que rotas como `/modulo-01/atividade-03` funcionem
ao recarregar a página.

### Rodar localmente com Docker

```sh
docker compose up --build
```

Acesse [http://localhost:8080](http://localhost:8080).

### Hospedar no Coolify

1. **New Resource → Application → Public Repository** e aponte para
   `https://github.com/SteveSilvas/dialo-game` (branch `master`).
2. Em **Build Pack**, escolha **Dockerfile** (o repositório já traz o `Dockerfile`
   na raiz; o `docker-compose.yml` também é detectado se preferir Compose).
3. **Ports Exposes**: `80` (a imagem serve o nginx nessa porta).
4. **Domain**: informe o domínio desejado (ex.: `dialo.seudominio.com.br`). O Coolify
   emite o certificado TLS automaticamente.
5. Clique em **Deploy**. A cada `git push` na branch configurada o Coolify refaz o
   build e publica a nova versão.

### Variável de build (opcional)

`VITE_SITE_URL` define o domínio usado nas tags `canonical` e Open Graph. Como o
`index.html` é estático, essas tags precisam de URL absoluta para o card aparecer
certo no WhatsApp, LinkedIn e X.

```sh
VITE_SITE_URL=https://dialo.seudominio.com.br
```

Defina no Coolify em **Environment Variables** antes do deploy. Sem ela, as URLs
saem relativas (`/og-image.png`) — funciona no navegador, mas o preview do link
fica sem imagem em algumas redes sociais.

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
