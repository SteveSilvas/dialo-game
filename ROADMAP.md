# ROADMAP — DIALO GAME

Roadmap de produto do Dialo Game: de um jogo de um único módulo para uma
plataforma de alfabetização com trilha de progressão, contas e progresso salvo.

> O histórico de auditoria, bugs corrigidos e refatorações já concluídas está em
> [`docs/historico-tecnico.md`](./docs/historico-tecnico.md). Este documento olha
> para frente.

**Estado atual:** Módulo 01 completo e publicado em
[dialo-game.vercel.app](https://dialo-game.vercel.app), com 5 atividades, 64 testes no
front e CI com deploy automático.

A **API já existe e está testada** em `apps/api` (.NET 10 + EF Core + PostgreSQL, 75
testes): cadastro/login com JWT e Google, catálogo de módulos e atividades, progresso
por atividade com estrelas calculadas no servidor e desbloqueio entre módulos
validado na API.

A **integração está feita**: o front consome esses endpoints. A trilha vem do
`GET /catalog`, cada atividade concluída é enviada para
`PUT /progress/activities/{slug}` e o progresso de convidado é importado ao entrar
na conta. Quem joga sem conta (ou sem rede) tem o progresso guardado no
`localStorage`.

Os tipos compartilhados vivem em `src/api/types.ts`, escritos à mão, e o front
continua na raiz do repositório — não houve migração para `apps/web` nem criação de
`packages/shared`, porque o front é o app publicado no Vercel e mover a raiz
quebraria o deploy sem ganho real.

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

## 3. Stack do backend: .NET 10 + EF Core

**Decidido: .NET 10 (LTS) com ASP.NET Core e EF Core.**

> Decisão registrada em [docs/adr/0001-stack-backend.md](docs/adr/0001-stack-backend.md),
> com contexto, alternativas e consequências.

| Item | Escolha | Por quê |
| --- | --- | --- |
| Runtime | **.NET 10 (LTS)** | Suporte até nov/2028. .NET 8 LTS saiu de suporte e .NET 11 é STS — nenhum dos dois serve |
| Framework | ASP.NET Core Web API | Minimal APIs ou Controllers, ambos no mesmo runtime |
| ORM | **EF Core** com migrations | *Code First*: classes C# → `dotnet ef migrations add` → banco |
| Banco | PostgreSQL | `Npgsql.EntityFrameworkCore.PostgreSQL` |
| Autenticação | JWT via `Microsoft.AspNetCore.Authentication.JwtBearer` | Access token + refresh próprio |
| Hash de senha | `Argon2` (lib externa) ou `PasswordHasher<T>` do ASP.NET Core | Ver issue #16 |
| Testes | xUnit + `Microsoft.AspNetCore.Mvc.Testing` | Testes de integração com a API real |
| Validação | Data Annotations + FluentValidation | Regras de username, email e senha |

O front continua em Vite + React + TypeScript no Vercel. A API roda em container
(.NET é multi-plataforma e a imagem `mcr.microsoft.com/dotnet/aspnet:10.0` já vem
pronta).

### Consequência aceita: dois runtimes no CI

O repositório passa a ter Node (front) e .NET (API). Isso custa um pouco de
complexidade no CI, mas o ganho é usar o ORM *code first* mais maduro do mercado e
a tipagem forte do C# no domínio de progresso e desbloqueio.

Para reduzir o atrito, os **tipos compartilhados** entre front e back são escritos à
mão em `src/api/types.ts`, mantidos junto do contrato de rotas e campos documentado
na seção 6. Não há geração automática de tipos a partir do C#: o custo é que uma
mudança de campo na API não quebra o build do front, apenas aparece em runtime. A
rede de segurança é `src/api/catalog.test.ts`, que fixa os nomes e formatos dos
campos que a API devolve.


---

## 4. Arquitetura alvo

```
┌─────────────────────────────┐        ┌──────────────────────────┐
│  Frontend (Vite + React)    │        │  Backend (.NET 10)       │
│  Vercel                     │        │  ASP.NET Core Web API    │
│                             │        │  container               │
│  • Trilha (árvore vertical) │  HTTPS │                          │
│  • Atividades               │ ─────► │  • Auth (JWT + Google)   │
│  • Estado (Jotai)           │  JSON  │  • Catálogo de módulos   │
│  • Convidado (localStorage) │        │  • Progresso             │
│  • Tipos em src/api/types   │        │  • Regras de desbloqueio │
└─────────────────────────────┘        └───────────┬──────────────┘
                                                    │ EF Core
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

## 5. Modelo de dados (EF Core, code first)

Entidades C# que geram o schema por migration. `Module` e `Activity` são
**catálogo**, não conteúdo do usuário.

```csharp
public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; }      // único, case-insensitive
    public string? Email { get; set; }        // único quando presente
    public string? PasswordHash { get; set; } // nulo se só Google
    public string? GoogleId { get; set; }
    public string? DisplayName { get; set; }
    public string? AvatarUrl { get; set; }
    public UserRole Role { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<ActivityProgress> Progress { get; set; } = [];
}

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TokenHash { get; set; }     // nunca o token em claro
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? UserAgent { get; set; }
}

public class Module
{
    public Guid Id { get; set; }
    public string Slug { get; set; }          // único
    public int Order { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Concept { get; set; }

    public ICollection<Activity> Activities { get; set; } = [];
}

public class Activity
{
    public Guid Id { get; set; }
    public Guid ModuleId { get; set; }
    public string Slug { get; set; }          // único
    public int Order { get; set; }
    public string Title { get; set; }
    public ActivityType Type { get; set; }
    public string Config { get; set; }        // JSONB: o que varia por atividade
    public bool IsRequired { get; set; } = true;
}

public class ActivityProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid ActivityId { get; set; }
    public int BestScore { get; set; }
    public int Attempts { get; set; }
    public int Errors { get; set; }
    public int Stars { get; set; }            // 0–3
    public DateTimeOffset? CompletedAt { get; set; }
    // índice único em (UserId, ActivityId)
}
```

`ModuleProgress` é **derivado**, não persistido: um módulo está concluído quando
todas as atividades com `IsRequired = true` têm `CompletedAt` preenchido. Calcular
sob demanda evita dado duplicado que sai de sincronia.

`Config` (JSONB) guarda o que varia por tipo de atividade (alfabeto alvo, pares de
rima, banco de palavras), sem alterar o schema a cada atividade nova. No EF Core
isso é mapeado para `jsonb` com `HasColumnType("jsonb")`.


---

## 6. Contrato da API

As rotas e os formatos de request/response estão definidos nesta tabela, que é a
referência para o front e o back. Os tipos TypeScript correspondentes vivem em
`src/api/types.ts`, escritos à mão — não há geração automática a partir do C#.

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

**Estado:** as fases 0, 1 e 2 estão concluídas. A fase 3 está parcial — a home do
módulo, a escolha livre de atividade, a trilha vertical desenhada, a tela de
conclusão de módulo e o mapa de progresso na home existem. As fases 4 e 5 seguemabertas.

### Fase 0 — Fundação (P0) ✅

| Issue | Entrega |
| --- | --- |
| ADR: registrar .NET 10 + EF Core | `docs/adr/0001-stack-backend.md` com a decisão da seção 3 |
| Contrato da API + modelo de dados | Tabela de rotas (seção 6), `src/api/types.ts` e diagrama ER |
| Estrutura do monorepo | Front na raiz e API em `apps/api` (.NET) |
| Postgres local + primeira migration | `docker compose` com Postgres e `dotnet ef migrations add` |

### Fase 1 — Contas e autenticação (P0) ✅

| Issue | Entrega |
| --- | --- |
| Cadastro com username/email + senha | Hash Argon2id, validação, username único |
| Login por username **ou** email com JWT | Access 15 min + refresh 7 dias |
| Login com Google | OIDC via Google Identity Services |
| Refresh, logout e `/auth/me` | Revogação de token, rotação |
| Telas de login/cadastro + guarda de rota | Front com validação e erros claros |

### Fase 2 — Progresso no servidor (P0) ✅

| Issue | Entrega |
| --- | --- |
| Catálogo de módulos e atividades + seed | Módulo 01 migrado para o banco |
| Registro de progresso por atividade | `PUT /progress/activities/:slug` |
| Desbloqueio de módulos no servidor | Regra + testes de autorização |
| Migração do estado local para a API | Jotai + modo convidado + `POST /progress/import` |

### Fase 3 — Trilha (P1) — parcial

| Issue | Entrega |
| --- | --- |
| Componente de trilha vertical | Árvore com estados e caminho desenhado |
| Página do módulo com atividades | Escolha livre dentro do módulo |
| Conclusão de módulo ✅ | Tela de parabéns, estrelas e "próximo módulo" |
| Mapa de progresso na home ✅ | Visão geral e retomada |
### Fase 4 — Conteúdo pedagógico (P1)

| Issue | Entrega |
| --- | --- |
| Módulo 02 — sons das letras | Consciência fonológica |
| Módulo 03 — sílabas | Consciência silábica |
| Módulo 04 — formar palavras | Síntese silábica |
| Módulo 05 — ler frases | Fluência e compreensão |
| Módulo 06 — escrever | Produção escrita |

### Fase 5 — Qualidade e operação (P1/P2) — parcial

| Issue | Entrega |
| --- | --- |
| CI do backend | Lint, testes e migrations em PR |
| Deploy da API + CORS | Ambiente, segredos e origens permitidas |
| Rate limiting e observabilidade | Proteção de login e logs estruturados |
| Acessibilidade e E2E da trilha | Teclado, leitor de tela e Playwright — feito: `playwright.config.ts`, specs em `e2e/` (convidado → conta, progressão, F5, teclado, axe WCAG 2.1 AA) e job `e2e` no CI |

---

## 10. Decisões abertas

| # | Questão | Impacto |
| --- | --- | --- |
| 1 | Estrelas por atividade: por acertos, por tempo ou por tentativas? | Modelo de dados |
| 2 | A criança tem login próprio ou sempre entra pelo adulto? | UX de cadastro |
| 3 | Conclusão do módulo exige 100% das atividades ou uma nota mínima? | Regra de desbloqueio |
| 4 | Domínio próprio para o site e a API? | Cookies e CORS |
| 5 | Hash de senha: `Argon2` (lib externa) ou `PasswordHasher<T>` do ASP.NET Core? | Issue #16 |

A stack do backend está decidida (seção 3). As decisões acima têm um padrão proposto
nas issues; podem ser ajustadas durante a implementação sem retrabalho estrutural.

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
| Custo de manter dois runtimes (Node + .NET) | Aceito conscientemente; front e back evoluem em deploys independentes |
| Vazar dados de crianças | Coletar o mínimo: username, e-mail do adulto, sem data de nascimento |
