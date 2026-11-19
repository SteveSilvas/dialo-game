# ROADMAP — DIALO GAME

Roadmap de produto do Dialo Game: de um jogo de um único módulo para uma
plataforma de alfabetização com trilha de progressão, contas e progresso salvo.

> O histórico de auditoria, bugs corrigidos e refatorações já concluídas está em
> [`docs/historico-tecnico.md`](./docs/historico-tecnico.md). Este documento olha
> para frente.

**Estado atual:** Módulo 01 completo e publicado em
[dialo-game.vercel.app](https://dialo-game.vercel.app), com 5 atividades, 56 testes,
CI e deploy automático. Todo o progresso vive na memória da sessão — recarregar a
página apaga tudo, e não existe usuário.

---

## 1. Visão

O Dialo Game é um jogo de alfabetização para crianças em fase de aquisição do
sistema de escrita. A criança avança por uma **trilha vertical** de módulos, cada um
trabalhando um conceito de alfabetização, e o progresso fica salvo na conta para ser
retomado de qualquer aparelho.

Três pilares:

1. **Progressão pedagógica** — os conceitos seguem a ordem natural da alfabetização:
   reconhecer símbolos → consciência fonológica → sílabas → palavras → frases →
   produção escrita.
2. **Autonomia com limites** — a criança escolhe qual atividade fazer dentro do
   módulo liberado, mas só avança de módulo cumprindo o anterior.
3. **Progresso que não se perde** — conta própria (ou Google), progresso no servidor.

### Público

Crianças de 4 a 8 anos em alfabetização, com um adulto (pai, mãe ou professor)
criando a conta. Isso define duas exigências de UX: a **trilha** precisa ser legível
sem depender de leitura para a criança, e o **cadastro** precisa ser simples para o
adulto.

---

## 2. Princípios de produto

| Princípio | Consequência prática |
| --- | --- |
| A criança não digita texto | Login é do adulto; a criança só clica e arrasta |
| Erro não pune | Erro não bloqueia avanço; só o acerto conta para conclusão |
| Progresso é visível | Cada módulo mostra quantas atividades faltam |
| Nada de becos sem saída | Módulo bloqueado explica *o que* falta, não só "bloqueado" |
| Funciona sem conta | Modo convidado joga o Módulo 01; progresso local migra ao entrar |

---

## 3. Decisão pendente: stack do backend

Esta é a **única decisão bloqueante** do roadmap. Tudo o mais pode começar.

O requisito é Postgres com *Code First*, JWT e login Google. Há dois caminhos
naturais:

| | **A — Node + TypeScript** (recomendado) | **B — .NET + EF Core** |
| --- | --- | --- |
| Framework | Fastify ou NestJS | ASP.NET Core |
| ORM *code first* | Prisma (`schema.prisma` → migration) | EF Core (migrations) |
| Linguagem | TS no back e no front | C# no back, TS no front |
| Tipos compartilhados | Direto (`packages/shared` + zod) | Precisa gerar/duplicar |
| CI | Um único toolchain (Node 26 já configurado) | Dois toolchains |

**Recomendação: A.** Unifica a linguagem, permite compartilhar os tipos do catálogo
e das respostas da API com o front, e reaproveita o Node 26 e o CI que já existem.
A perda é não usar EF Core, que é o ORM *code first* mais maduro do mercado.

> Se a preferência for **B**, os épicos de backend mudam de stack; os de produto,
> trilha e conteúdo não mudam.

---

## 4. Arquitetura alvo

```
┌─────────────────────────────┐        ┌──────────────────────────┐
│  Frontend (Vite + React)    │        │  Backend (API REST)      │
│  Vercel                     │        │  container / PaaS        │
│                             │        │                          │
│  • Trilha (árvore vertical) │  HTTPS │  • Auth (JWT + Google)   │
│  • Atividades               │ ─────► │  • Catálogo de módulos   │
│  • Estado (Jotai)           │  JSON  │  • Progresso             │
│  • Convidado (localStorage) │        │  • Regras de desbloqueio │
└─────────────────────────────┘        └───────────┬──────────────┘
                                                    │ SQL
                                        ┌───────────▼──────────────┐
                                        │  PostgreSQL              │
                                        │  (migrations code first) │
                                        └──────────────────────────┘
```

**Autenticação:** access token JWT curto (15 min, em memória) + refresh token
longo (7 dias, em cookie `HttpOnly` + `Secure` + `SameSite=None`). O refresh em
cookie impede que um XSS roube a sessão; o access em memória evita persistir
credencial em `localStorage`. Como o front (Vercel) e a API ficam em domínios
diferentes, o cookie exige `SameSite=None`, CORS com credenciais e lista fechada de
origens.

**Convidado:** quem ainda não tem conta joga o Módulo 01 com progresso em
`localStorage`. No primeiro login, o progresso local é enviado para o servidor e
mesclado (fica o maior valor por atividade).

---

## 5. Modelo de dados (code first)

```
User             id, username* (único), email* (único, opcional p/ Google),
                 passwordHash (nulo se só Google), googleId, displayName,
                 avatarUrl, role, createdAt

RefreshToken     id, userId, tokenHash, expiresAt, revokedAt, userAgent

Module           id, slug* (único), order, title, description, concept

Activity         id, moduleId, slug* (único), order, title, type, config (JSONB)

ActivityProgress id, userId, activityId, bestScore, attempts, errors,
                 stars (0–3), completedAt
                 └ único por (userId, activityId)

ModuleProgress   derivado: módulo concluído quando todas as atividades
                 obrigatórias têm completedAt
```

`Module` e `Activity` são **catálogo**, não conteúdo do usuário: entram por seed a
partir de um arquivo versionado no repositório, para que o conteúdo seja revisável
em PR. `config` (JSONB) guarda o que varia por tipo de atividade (alfabeto alvo,
pares de rima, banco de palavras), sem alterar o schema a cada atividade nova.

---

## 6. Contrato da API

Definido em OpenAPI antes da implementação (`docs/api/openapi.yaml`), para que front
e back andem em paralelo.

| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/auth/register` | username, email (opcional), senha |
| `POST` | `/auth/login` | `identifier` (username **ou** email) + senha |
| `POST` | `/auth/google` | `idToken` do Google Identity Services |
| `POST` | `/auth/refresh` | troca refresh cookie por novo access token |
| `POST` | `/auth/logout` | revoga o refresh token |
| `GET` | `/auth/me` | perfil do usuário autenticado |
| `GET` | `/catalog` | módulos + atividades + estado de desbloqueio |
| `GET` | `/progress` | progresso consolidado do usuário |
| `PUT` | `/progress/activities/:slug` | registra resultado de uma atividade |
| `POST` | `/progress/import` | mescla progresso local do convidado |
| `GET` | `/health` | liveness/readiness |

Regra de ouro: **o servidor decide o desbloqueio**, nunca o cliente. O front esconde
o que está bloqueado, mas quem valida é a API — caso contrário, basta editar o
`localStorage` para pular módulos.

---

## 7. Catálogo de módulos (conceitos de alfabetização)

| # | Módulo | Conceito | Exemplo de atividade |
| --- | --- | --- | --- |
| 01 | Reconhecer símbolos ✅ | Princípio alfabético | Achar letras, números, vogais, consoantes |
| 02 | Sons das letras | Consciência fonológica | "Com que som começa *bola*?"; rimas |
| 03 | Sílabas | Consciência silábica | Contar sílabas; juntar `ba` + `la` = `bala` |
| 04 | Formar palavras | Síntese | Montar palavra a partir de sílabas/imagem |
| 05 | Ler frases | Fluência e compreensão | Associar frase a imagem; ordem da frase |
| 06 | Escrever | Produção escrita | Completar palavra; escrever o que vê |

O Módulo 01 é o único pronto. Os demais são o escopo deste roadmap.

---

## 8. A trilha (árvore vertical)

Tela principal depois do login: uma coluna vertical com os módulos como nós
grandes, ligados por um caminho desenhado, e as atividades do módulo atual abrindo
em ramos menores abaixo do nó.

```
        ╭──────────╮
        │  MÓDULO 1│  ✅ concluído
        ╰────┬─────╯
     ┌───────┴───────┐
     ●  ●  ●  ●  ●        ← atividades (escolha livre)
             │
        ╭────▼─────╮
        │  MÓDULO 2│  ▶ atual
        ╰────┬─────╯
     ┌───────┴───────┐
     ●  ●  ●  ●  ●
             │
        ╭────▼─────╮
        │  MÓDULO 3│  🔒 bloqueado — "Conclua o módulo 2"
        ╰──────────╯
```

**Reconciliação dos dois requisitos.** "Progressão obrigatória" e "escolher alguma na
trilha" convivem em níveis diferentes:

- **Entre módulos:** obrigatório e sequencial. O módulo N só abre com N−1 concluído.
- **Dentro do módulo liberado:** livre escolha. A criança toca na atividade que
  quiser, na ordem que quiser.

Assim a trilha oferece escolha real sem furar a sequência pedagógica.

Estados visuais: **concluído** (check + estrelas), **atual** (pulsando), **bloqueado**
(cadeado + motivo). A trilha rola verticalmente e posiciona a criança no módulo atual
ao abrir.

---

## 9. Fases e issues

Cada linha vira uma issue no GitHub. Ordem = ordem de dependência.

### Fase 0 — Fundação (P0)

| Issue | Entrega |
| --- | --- |
| ADR: stack do backend | Documento com a decisão A/B da seção 3 |
| Contrato OpenAPI + modelo de dados | `docs/api/openapi.yaml` e diagrama ER |
| Estrutura do monorepo | `apps/web`, `apps/api`, `packages/shared` |
| Postgres local + primeira migration | `docker compose` com Postgres e migration inicial |

### Fase 1 — Contas e autenticação (P0)

| Issue | Entrega |
| --- | --- |
| Cadastro com username/email + senha | Hash Argon2id, validação, username único |
| Login por username **ou** email com JWT | Access 15 min + refresh 7 dias |
| Login com Google | OIDC via Google Identity Services |
| Refresh, logout e `/auth/me` | Revogação de token, rotação |
| Telas de login/cadastro + guarda de rota | Front com validação e erros claros |

### Fase 2 — Progresso no servidor (P0)

| Issue | Entrega |
| --- | --- |
| Catálogo de módulos e atividades + seed | Módulo 01 migrado para o banco |
| Registro de progresso por atividade | `PUT /progress/activities/:slug` |
| Desbloqueio de módulos no servidor | Regra + testes de autorização |
| Migração do estado local para a API | Jotai + modo convidado + `POST /progress/import` |

### Fase 3 — Trilha (P1)

| Issue | Entrega |
| --- | --- |
| Componente de trilha vertical | Árvore com estados e caminho desenhado |
| Página do módulo com atividades | Escolha livre dentro do módulo |
| Conclusão de módulo | Tela de parabéns, estrelas e "próximo módulo" |
| Mapa de progresso na home | Visão geral e retomada |

### Fase 4 — Conteúdo pedagógico (P1)

| Issue | Entrega |
| --- | --- |
| Módulo 02 — sons das letras | Consciência fonológica |
| Módulo 03 — sílabas | Consciência silábica |
| Módulo 04 — formar palavras | Síntese silábica |
| Módulo 05 — ler frases | Fluência e compreensão |
| Módulo 06 — escrever | Produção escrita |

### Fase 5 — Qualidade e operação (P1/P2)

| Issue | Entrega |
| --- | --- |
| CI do backend | Lint, testes e migrations em PR |
| Deploy da API + CORS | Ambiente, segredos e origens permitidas |
| Rate limiting e observabilidade | Proteção de login e logs estruturados |
| Acessibilidade e E2E da trilha | Teclado, leitor de tela e Playwright |

---

## 10. Decisões abertas

| # | Questão | Impacto |
| --- | --- | --- |
| 1 | Stack do backend: Node/TS ou .NET/EF Core (seção 3) | Bloqueia a Fase 0 |
| 2 | Estrelas por atividade: por acertos, por tempo ou por tentativas? | Modelo de dados |
| 3 | A criança tem login próprio ou sempre entra pelo adulto? | UX de cadastro |
| 4 | Conclusão do módulo exige 100% das atividades ou uma nota mínima? | Regra de desbloqueio |
| 5 | Domínio próprio para o site e a API? | Cookies e CORS |

As decisões 2–4 têm um padrão proposto nas issues; podem ser ajustadas durante a
implementação sem retrabalho estrutural.

---

## 11. Métricas de sucesso

| Métrica | Meta inicial |
| --- | --- |
| Conclusão do Módulo 01 | ≥ 60% de quem inicia a atividade 01 |
| Retorno em 7 dias | ≥ 30% das contas criadas |
| Abandono no cadastro | < 40% de quem abre a tela de login |
| Erro por atividade | ≤ 3 tentativas erradas em média |
| Tempo até a primeira atividade | < 60 s desde o primeiro acesso |

---

## 12. Riscos

| Risco | Mitigação |
| --- | --- |
| Login ser barreira para a criança | Modo convidado com o Módulo 01 completo |
| Progresso perdido gera frustração | Sincronização otimista + fila local de escrita |
| Conteúdo pedagógico sem validação | Revisão por educador antes de publicar cada módulo |
| Custo de manter dois runtimes | Argumento a favor da stack A (seção 3) |
| Vazar dados de crianças | Coletar o mínimo: username, e-mail do adulto, sem data de nascimento |
