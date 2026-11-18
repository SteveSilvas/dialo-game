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
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="React Router" src="https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white" />
  <img alt="Jotai" src="https://img.shields.io/badge/Jotai-3-000000?logo=jotai&logoColor=white" />
  <img alt="Jest" src="https://img.shields.io/badge/Jest-30-C21325?logo=jest&logoColor=white" />
  <img alt="ESLint" src="https://img.shields.io/badge/ESLint-10-4B32C3?logo=eslint&logoColor=white" />
</p>

- **[React 19](https://react.dev/)** — biblioteca para construção de interfaces.
- **[TypeScript](https://www.typescriptlang.org/)** — tipagem estática e segurança no código.
- **[Vite](https://vite.dev/)** — build e servidor de desenvolvimento ultrarrápidos.
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

## Estrutura do projeto

```
src/
├── assets/               # Imagens, logos e arquivos de áudio
├── components/           # Componentes reutilizáveis (Button, BoxRow, PanelPoints, ActivityGrid...)
├── Context/              # Estado global com Jotai
├── hooks/                # Hooks reutilizáveis (useActivityProgress)
├── pages/                # Telas e atividades do jogo
│   ├── modulo_01/        # Atividades do módulo 01
│   └── NotFound/         # Página para rotas não encontradas
├── routes/               # Definição das rotas da aplicação
├── utils/                # Funções auxiliares (validações, sons, geradores)
├── App.tsx               # Tela inicial
└── main.tsx              # Ponto de entrada da aplicação
```

## Autor

Desenvolvido por **Steve Silva** — Desenvolvedor Full Stack na **Infotecdevs**, em São Paulo, Brasil.

- GitHub: [@SteveSilvas](https://github.com/SteveSilvas)

## Licença

Este projeto está sob a licença **MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
