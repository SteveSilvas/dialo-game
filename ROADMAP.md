# ROADMAP — DIALO GAME

Documento vivo com as melhorias identificadas na auditoria do projeto. Os **bugs reais
já foram corrigidos** (ver seção *Corrigido*). Os itens abaixo são as próximas etapas de
construção, priorizadas por impacto.

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

- [ ] Adicionar media queries de layout: tudo hoje é `100vw` com tamanhos fixos (`4rem`,
      `7rem`); em telas pequenas os botões estouram e quebram.
- [ ] Adicionar `aria-label` em todos os botões que só têm ícone (home, refresh, setas).
- [ ] Revisar contraste — há texto claro sobre `--infantil-3` (verde claro), abaixo do
      mínimo WCAG AA para texto pequeno.
- [ ] Trocar `cursor: cell` (estranho para botão) por `cursor: pointer`.
- [ ] Associar `<label>` a controles com `htmlFor`/`id`.
- [ ] Respeitar `prefers-reduced-motion` nas animações (`fade-out`, `logo-spin`).

### 4. Performance de áudio

- [ ] `soudMr.mp3` tem **2,3 MB** e é instanciado na home e no layout. Comprimir ou trocar.
- [ ] `playSound` cria um `new Audio()` a cada clique; pré-carregar os sons em um cache e
      reutilizar as instâncias para evitar atraso/estouro de memória.
- [ ] Avaliar `preload="none"` para sons que só tocam sob demanda.

### 5. UX e produto

- [ ] Persistir o progresso (acertos, atividades concluídas) — o Jotai já está no projeto.
- [ ] Tela de conclusão de módulo (parabéns / resumo de pontos) em vez de voltar direto.
- [ ] `meta description` e tags Open Graph no `index.html` para compartilhamento.
- [ ] `<title>` dinâmico por atividade (ajuda no histórico e na acessibilidade).
- [ ] Módulo 02 (as rotas `modulo-02` já foram previstas e hoje caem no 404).

### 6. Qualidade e entrega

- [x] Adicionados testes (Jest + Testing Library) para as funções de validação, os
      geradores de arrays e o fluxo da atividade 01 (`npm test`).
- [ ] Configurar CI (GitHub Actions) rodando `lint` + `build` + testes em cada PR.
- [ ] Configurar deploy automático (GitHub Pages/Vercel) a partir do `master`.
- [ ] Adicionar `strict` já está ativo; avaliar `noUncheckedIndexedAccess` no tsconfig.
