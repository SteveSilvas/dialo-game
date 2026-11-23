# AGENTS.md

Contexto do repositório para agentes que trabalharem aqui.

## Estrutura

- Front na raiz (React 19 + Vite + TypeScript, Jest, Playwright em `e2e/`).
- API em `apps/api` (.NET 10, solution `DialoGame.slnx`, xUnit).

## Comandos

```sh
npm ci && npm run lint && npm test && npm run build   # front
cd apps/api && dotnet build DialoGame.slnx && dotnet test DialoGame.slnx
```

## EF / migrations

O `dotnet ef` **exige** `--startup-project src/DialoGame.Infrastructure`, não a
API: o `DesignTimeDbContextFactory` mora na Infrastructure e a API não referencia
`Microsoft.EntityFrameworkCore.Design`. Usar `src/DialoGame.Api` falha com
*"doesn't reference Microsoft.EntityFrameworkCore.Design"*.

A conexão vem de `ConnectionStrings__Default`. `database update` aceita
`--connection`, mas `database drop` **não** — para o drop, exporte a variável de
ambiente.

## CI

Dois workflows, um por runtime: `ci.yml` (front) e `api.yml` (API).

Badge de workflow **não** filtra por job — nem o do GitHub (`?job=` é ignorado,
retorna o status do workflow inteiro) nem o do shields. Por isso front e API são
arquivos separados: é a única forma de ter um badge por runtime.

## Validação sem dotnet no host

O host não tem `dotnet`. Valide com Docker:

```sh
sudo docker run -d --name ci-dotnet --network host -v "$PWD/apps/api:/src" \
  -w /src mcr.microsoft.com/dotnet/sdk:10.0 sleep infinity
```

`--network host` é necessário: no sandbox a rede bridge não tem saída. Postgres
de teste: `postgres:17-alpine` com `POSTGRES_USER=dialo`,
`POSTGRES_PASSWORD=dialo_dev`.

### `dotnet test` pode sair 0 sem rodar nada

No sandbox, `dotnet test DialoGame.slnx` (mesmo com `--no-build -c Release`)
terminou com código 0 e **nenhuma saída**, sem executar teste algum — o mesmo
comando que o CI usa. Não confie no código de saída aqui. Rode o DLL direto,
que imprime o resultado de verdade:

```sh
sudo docker run --rm --network host -v "$PWD/apps/api:/src" -w /src \
  -e ConnectionStrings__Default="Host=127.0.0.1;Port=5432;Database=dialo;Username=dialo;Password=dialo_dev" \
  mcr.microsoft.com/dotnet/sdk:10.0 \
  dotnet vstest tests/DialoGame.Tests/bin/Release/net10.0/DialoGame.Tests.dll
```

Os testes de integração criam um banco por classe (`ApiFactory`), então o
Postgres precisa aceitar conexões antes de rodar.

## Branch protection

O token de automação recebe `403` na API de branch protection (exige admin).
Regras de proteção precisam ser criadas no painel, não por PR.
