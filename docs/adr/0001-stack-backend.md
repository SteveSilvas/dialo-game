# ADR 0001 — Stack do backend

- **Status:** Aceito
- **Data:** 2026-11-19
- **Decisores:** Steve Silva
- **Issue:** [#12](https://github.com/SteveSilvas/dialo-game/issues/12)
- **Substitui:** —
- **Substituído por:** —

## Contexto

O DIALO GAME hoje é um front estático (Vite + React + TypeScript no Vercel) que guarda
todo o progresso em memória. Ao recarregar a página, a criança perde o que fez.

O roadmap pede três coisas que exigem servidor:

1. **Progresso persistido**, sobrevivendo a logout, recarregamento e troca de aparelho.
2. **Progressão obrigatória entre módulos**, com a regra decidida no servidor. Se a
   regra viver só no cliente, basta editar o `localStorage` para pular a trilha inteira.
3. **Contas**, com login por username/email e por Google.

O requisito de persistência aponta para PostgreSQL. O de manutenção aponta para
migrations *code first*: o schema nasce do código, versionado em PR, não de SQL escrito
à mão que divergiria do modelo.

A escolha da stack era a única decisão bloqueante da Fase 0 — nenhuma issue de backend
podia começar sem ela.

### Forças em jogo

| Força | Peso |
| --- | --- |
| Domínio com regras não triviais (desbloqueio, melhor nota, estrelas) | Alto — pede tipagem forte e testes |
| ORM *code first* maduro | Alto — requisito explícito |
| Time de uma pessoa, manutenção de longo prazo | Alto — quanto menos superfície, melhor |
| Front já em TypeScript | Médio — compartilhar tipos seria conveniente |
| CI já configurado em Node | Médio — um segundo runtime custa |
| Público infantil, segurança de sessão | Alto — sem espaço para improviso em auth |

## Decisão

**Backend em .NET 10 (LTS) com ASP.NET Core Web API e EF Core sobre PostgreSQL.**

| Item | Escolha | Versão |
| --- | --- | --- |
| Runtime | .NET | **10.0 (LTS)** |
| Framework | ASP.NET Core Web API | 10.0 |
| ORM | EF Core + migrations | 10.0.15 |
| Provider | `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.3 |
| Auth | `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.0.15 |
| Google | `Google.Apis.Auth` | 1.78.0 |
| Testes | xUnit + `Microsoft.AspNetCore.Mvc.Testing` | — |
| Imagem | `mcr.microsoft.com/dotnet/aspnet:10.0` | — |

### Por que .NET 10 e não 8 ou 11

Verificado no `releases-index.json` oficial do repositório `dotnet/core`:

| Versão | Tipo | Situação em nov/2026 |
| --- | --- | --- |
| **10.0** | **LTS** | **Ativo**, suporte até 2028-11-14 |
| 11.0 | STS | Ativo, janela curta (STS tem 18 meses) |
| 9.0 | STS | Fora de suporte |
| 8.0 | LTS | **Fora de suporte** (encerrou em 2026-11-10) |

O .NET 8 era LTS, mas acabou de sair de suporte. O .NET 11 é STS: receberia correções
por pouco mais de um ano e depois obrigaria outra migração. O **10** é a única versão
que combina LTS com suporte ativo — e para um projeto que vai durar, isso não é detalhe.

### Por que EF Core

O requisito era *code first*. O EF Core é o ORM *code first* mais maduro do ecossistema
.NET: as entidades em C# são a fonte da verdade e `dotnet ef migrations add` gera o SQL
versionado. Isso torna o modelo revisável em PR — dá para ler a mudança de schema sem
executar nada.

### Por que PostgreSQL

Já era o requisito. O `Npgsql` é o provider oficial, com suporte a `jsonb` — usado em
`Activity.Config`, onde fica o que varia por tipo de atividade (alfabeto alvo, pares de
rima, banco de palavras) sem alterar o schema a cada atividade nova.

## Consequências

### Positivas

- **A regra de desbloqueio fica onde deve ficar.** Um serviço em C#, testável isolado,
  recusando `403` quando o cliente tenta pular um módulo bloqueado.
- **Schema versionado em PR.** Migration é código, revisável junto com a entidade.
- **Tipagem forte no domínio.** `BestScore`, `Stars`, `CompletedAt` e a regra de
  progressão ganham tipos explícitos, sem `any` no caminho.
- **Auth madura.** O `JwtBearer` do ASP.NET Core já valida `iss`, `aud` e `exp`; o
  `PasswordHasher<T>` e o `AddRateLimiter` vêm no framework.
- **Testes de integração reais.** `WebApplicationFactory` sobe a API em memória,
  exercitando pipeline, middleware e banco de verdade.

### Negativas (aceitas)

- **Dois runtimes no CI.** O repositório passa a ter Node (front) e .NET (API). Custa
  um job a mais e cache de NuGet separado. **Aceito:** o ganho de usar EF Core compensa
  a complexidade; a issue #34 trata o CI.
- **Sem compartilhamento direto de tipos.** C# e TypeScript não se falam. **Mitigação:**
  os tipos do front são escritos à mão em `packages/shared`, e o contrato das rotas e
  campos fica documentado em uma tabela no [ROADMAP §6](../../ROADMAP.md). O risco de
  divergência é real: um campo renomeado na API não quebra o build do front, só aparece
  em runtime. **Aceito** por decisão de não adotar OpenAPI; a rede de segurança é o teste
  E2E (#37), que exercita os fluxos reais contra a API.
- **Curva de contexto.** Quem só mexe no front precisa do SDK .NET para rodar a API
  localmente. **Mitigação:** `docker compose` sobe API + Postgres sem instalar SDK.
- **Imagem Docker maior** que um runtime Node. **Aceito:** a imagem `aspnet:10.0` é
  maior que a de Node, o que é irrelevante para o volume do projeto.

### Neutras

- O front continua no Vercel; a API vai para container. São deploys independentes.

## Alternativas consideradas

### A — Node + TypeScript (Fastify ou NestJS) com Prisma

**A favor:** um único toolchain, tipos compartilhados direto com o front via
`packages/shared`, reaproveitamento do CI em Node já existente.

**Contra:** o Prisma, embora bom, é menos maduro que o EF Core em migrations
complexas; e o ganho de compartilhar tipos é menor do que parece — o front consumiria
os tipos do `packages/shared` de qualquer forma, e a API muda com menos frequência que
o front.

**Por que não:** a decisão do time foi .NET. Os pontos a favor de Node são reais, mas
não superam a preferência declarada nem a maturidade do EF Core no requisito *code
first*.

### B — .NET com Dapper e SQL escrito à mão

**Por que não:** contraria o requisito de *code first*. Migrations manuais divergem do
modelo com o tempo.

### C — BaaS (Supabase ou Firebase)

**A favor:** auth e banco prontos, menos código.

**Por que não:** a regra de desbloqueio e o cálculo de estrelas são lógica de domínio.
Em BaaS isso vira função no cliente ou *edge function* — e o requisito é que a regra
more no servidor. Além disso, dados de crianças pedem controle explícito de onde ficam.

## Referências

- [.NET release index oficial](https://github.com/dotnet/core/blob/main/release-notes/releases-index.json)
- [.NET support policy](https://dotnet.microsoft.com/platform/support/policy/dotnet-core)
- [EF Core migrations](https://learn.microsoft.com/ef/core/managing-schemas/migrations/)
- [Npgsql EF Core provider](https://www.npgsql.org/efcore/)
- [ROADMAP §3](../../ROADMAP.md)
