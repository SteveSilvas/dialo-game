# Histórico técnico — DIALO GAME

Registro da auditoria do projeto: bugs corrigidos, refatorações e melhorias já
concluídas. Para o que vem a seguir, veja o [`ROADMAP.md`](../ROADMAP.md) na raiz.

Os **bugs reais já foram corrigidos** (ver seção *Corrigido*). Os itens abaixo
registram o que foi feito e o que restou de manutenção pontual.

---

## Corrigido (bugs reais)

- [x] **`--infantil-6` nunca foi definida** — usada em 14 pontos (fundo do painel de pontos,
      caixas de atividade, caixa do módulo e cor de ícones). Definida como `#ffffff`,
      conforme a paleta de origem (`AdobeColor-infantil.jpeg`).
- [x] **Navegação inconsistente** — "PRÓXIMA" da atividade 04 e 05 apontava para
      `/modulo-02/*` (rota inexistente → 404) e o "VOLTAR" da atividade 05 pulava a 04.
      Sequência 01 → 02 → 03 → 04 → 05 → módulo agora é contínua.
- [x] **Atividade 05 exibia textos em inglês** ("Front", "Back", "Right", "Left", "Bottom")
      de um cubo 3D abandonado. Removido e substituído por uma caixa de destino real.
- [x] **Atividade 05 usava classes CSS inexistentes** (`page-activity-05`,
      `title-ativity-01`), perdendo o layout base. Corrigido para `page` e `title-ativity`.
- [x] **Drop duplicado na atividade 05** — o `onDrop` do botão e o do contêiner disparavam
      os dois (bubbling), contando a jogada duas vezes. Removido o handler do botão.
- [x] **`isNumber` aceitava lixo** — `''`, `'  '` e `'Infinity'` retornavam `true`.
      Agora usa `Number.isFinite` sobre a string aparada.
- [x] **Colisão de `.label-container`** — definida em 3 arquivos CSS; a última importada
      vencia. Consolidada em `LabelValue`, removido o CSS morto de `BoxRow`/`PanelPoints`.
- [x] **Texto invisível no painel de pontos** — `.hits`/`.errors` usavam `color` e
      `background-color` iguais (verde-sobre-verde, vermelho-sobre-vermelho). Corrigido.
- [x] **Números repetidos na atividade 02** — `generateRandomNumbersArray` sorteava com
      reposição (ex.: "13" aparecia 6 vezes); clicar removia todas as cópias contando um
      único acerto. Agora o sorteio é sem repetição.
- [x] **Erro fantasma ao acertar** — o painel calculava `erros = tentativas - acertos`, então
      durante a animação de 1 s de um acerto o erro subia para 1. Erros passaram a ser
      contados de forma explícita.
- [x] **Link morto do autor** — a logo da home apontava para `steve.infotecdevs.com.br`
      (domínio inexistente, NXDOMAIN). Agora aponta para o repositório no GitHub.
- [x] **Home do módulo com placeholder** — o cartão "Letras 2" foi renomeado para "DESAFIO"
      e vogais/consoantes/desafio passaram a usar a miniatura de letras (antes repetiam a
      imagem de números).

---

## Próximas etapas

### 1. Manutenção e limpeza (concluído)

- [x] Removidos arquivos não utilizados: `src/utils/convertions.ts`, `src/assets/react.svg`,
      `public/vite.svg`, `src/assets/logo.svg`, `src/assets/modulo_01/logo-mini.png`,
      `src/assets/AdobeColor-infantil.jpeg`, `src/assets/1-efek-sound-1-220034.mp3`.
- [x] Removido `"main": "src/index.tsx"` do `package.json` — apontava para arquivo
      inexistente (app Vite tem entrada em `index.html`).
- [x] Removido o `export default` órfão de `src/utils/validations.ts`.
- [x] Removido o bloco `@media (prefers-color-scheme: light)` duplicado em 6 arquivos CSS;
      tema fixado como claro (`color-scheme: light`) e cor de texto centralizada em `.page`.
- [x] Removido o CSS morto de `.logo.react`, `.read-the-docs` e `logo-spin` (herança do
      template do Vite).

### 2. Refatoração estrutural (concluído)

- [x] **Atividades 01–04 unificadas** em um único componente parametrizado
      (`<ActivityGrid />`), recebendo título, validador, gerador de opções e navegação.
      Os 4 arquivos quase idênticos viraram wrappers finos e os 4 CSS duplicados foram
      substituídos por um único `ActivityGrid/index.css`.
- [x] Extraído o componente `SymbolsGrid`, reutilizado pelas atividades 01–05.
- [x] Lógica de pontuação (acertos/erros/tentativas) centralizada no hook
      `useActivityProgress`, junto com a animação de saída, o reset e a detecção de fim.
- [x] `useMemo` de `finish` e efeitos de som movidos para o mesmo hook.

### 3. Responsividade e acessibilidade

- [x] **Tailwind CSS v4 integrado** (`@tailwindcss/vite`) com a paleta infantil mapeada no
      `@theme`; o CSS dos componentes foi movido para `@layer components`, permitindo que os
      utilitários responsivos sobrescrevam os estilos base.
- [x] **Layout responsivo** — botões de símbolos, cabeçalho, logo, caixas de atividade e
      painel de pontos agora escalam por breakpoints (`sm`, `md`) e as caixas da atividade 05
      empilham no mobile. `100vw` trocado por `100%` (evitava rolagem horizontal).
- [x] Adicionar `aria-label` em todos os botões que só têm ícone (home, refresh, setas),
      via prop `ariaLabel` no `CustomButton`; o toggle de som expõe estado com `aria-pressed`.
- [x] Revisar contraste. Texto passou de tons claros sobre pastel para `--ink`
      (`#213547`), que mantém >= 4.5:1 sobre toda a paleta. Medições finais:

      | Elemento | Antes | Depois |
      | --- | --- | --- |
      | `.button` normal | 1.84:1 | **5.91:1** |
      | `.button` hover | 1.40:1 | **7.75:1** |
      | `.button-simbols` | 2.13:1 | **5.91:1** |
      | `.button-sound` | 1.03:1 | **5.91:1** |
      | `.box-container` / `.label-container` normal | 2.20:1 | **12.61:1** |
      | `.box-container` / `.label-container` hover | 1.89:1 | **5.74:1** |
      | Ícones inline (antes `white`) | 2.13:1 | **5.91:1** |
      | Links | 4.09:1 | **12.61:1** |

      A paleta pastel não mudou — só a cor do texto. `src/utils/contrast.test.ts`
      trava esses pares para não regredirem.
- [x] Associar `<label>` a controles com `htmlFor`/`id` — o projeto não tem nenhum
      `<input>`/`<select>`/`<textarea>`; não há o que rotular.
- [x] Respeitar `prefers-reduced-motion`: animações e transições são reduzidas a 0,01ms
      para quem pediu menos movimento no sistema. A remoção do símbolo usa `setTimeout`,
      não o fim da animação, então o fluxo do jogo não depende dela.

### 4. Performance de áudio

- [x] `soudMr.mp3` (**2,3 MB**) recomprimido para Opus 40 kbps (654 kB) com fallback MP3
      (587 kB), servido de `public/audio/` e instanciado apenas no `Layout`.
- [x] `preload="none"` no player da música de fundo: o download só começa no gesto em
      **INICIAR**, o que também evita bloqueio de autoplay.
- [x] Avaliar `preload="none"` para sons que só tocam sob demanda — os efeitos são curtos
      (2,6 kB a 70 kB) e tocam sob demanda, então não precisam de pré-carga.
- [ ] `playSound` cria um `new Audio()` a cada clique; pré-carregar os sons em um cache e
      reutilizar as instâncias. Hoje o `play()` também ignora a promessa rejeitada, o que
      gera `UnhandledPromiseRejection` quando o navegador bloqueia o áudio.

### 4.1 Correções aplicadas

- [x] **Clique duplo inflava a pontuação** — durante o 1 s de animação de saída, um
      segundo clique no mesmo símbolo adicionava o item duas vezes em `optionsFound` e
      contava duas tentativas. Um único timer compartilhado também fazia o segundo
      clique cancelar a remoção do primeiro, devolvendo à grade um símbolo já acertado.
      Agora cada item tem seu próprio timer e itens em saída ignoram novos cliques.
- [x] **Recarregar rota interna dava 404 em produção** — o `nginx.conf` tinha o
      *fallback* de SPA, mas o deploy real é no Vercel, que não lê esse arquivo. Sem
      `vercel.json`, `/modulo-01` e `/modulo-01/atividade-01` devolviam 404 no F5 e em
      links compartilhados. Adicionado o rewrite para `index.html`.
- [x] **Open Graph sem imagem em produção** — `VITE_SITE_URL` não estava definida, então
      `og:image` saía relativa e o card do link não mostrava imagem. O build agora usa
      `VERCEL_PROJECT_PRODUCTION_URL` quando `VITE_SITE_URL` não existe.
- [x] **Bug no `reset()` de `useActivityProgress`**: o `setTimeout` da animação de saída
      não era cancelado. Se a criança acertasse um símbolo e tocasse em "reiniciar" antes
      de 1 s, o callback antigo rodava depois do reset e removia o símbolo recém-sorteado.
      Corrigido guardando o id do timer em `useRef`, limpando em `reset()` e no unmount.
      Coberto por `src/hooks/useActivityProgress.test.ts`.

### 5. UX e produto

- [ ] Persistir o progresso (acertos, atividades concluídas) — o Jotai já está no projeto.
- [ ] Tela de conclusão de módulo (parabéns / resumo de pontos) em vez de voltar direto.
- [x] `meta description` e tags Open Graph no `index.html` para compartilhamento.
      Inclui `og:image` 1200×630 (`public/og-image.png`, 160 kB), `og:image:alt`,
      `theme-color` e `twitter:card`. A URL absoluta vem de `VITE_SITE_URL`, aplicada
      no build pelo plugin `site-url` do `vite.config.ts`.
- [x] `<title>` dinâmico por atividade (ajuda no histórico e na acessibilidade).
      `src/components/DocumentTitle` mapeia cada rota; rota desconhecida vira
      "Página não encontrada | Dialo Game".
- [ ] Módulo 02 (as rotas `modulo-02` já foram previstas e hoje caem no 404).

### 6. Qualidade e entrega

- [x] Adicionados testes (Jest + Testing Library) para as funções de validação, os
      geradores de arrays e o fluxo da atividade 01 (`npm test`).
- [x] Configurar CI (GitHub Actions) rodando `lint` + `test` + `build` em cada PR,
      com badge de status no README.
- [x] Deploy automático no Vercel a partir do `master` (cada PR gera preview).
      O `Dockerfile` + `nginx.conf` continuam válidos para hospedagem em container.
- [ ] Adicionar `strict` já está ativo; avaliar `noUncheckedIndexedAccess` no tsconfig.
