# ADR 0003 — Probes de saúde separados e CORS validado no boot

- **Status:** Aceito
- **Data:** 2026-11-25
- **Contexto da issue:** #35 (deploy da API e configuração de CORS)

## Contexto

A API expunha um único `GET /health` que executava `AddDbContextCheck`, ou seja,
abria uma conexão com o Postgres a cada chamada. Esse mesmo endpoint era usado
como liveness e como readiness — no `docker-compose.yml`, no `playwright.config.ts`
e na documentação.

Um liveness que depende do banco tem uma consequência específica: quando o
Postgres fica indisponível, o orquestrador conclui que a API está morta e reinicia
o container. Reiniciar não conserta um banco fora do ar, e cada reinício derruba
uma API que estava perfeitamente capaz de responder — inclusive os endpoints que
não dependem do banco. O erro se amplifica: o banco volta, mas a API está no meio
de um ciclo de reinício.

Em paralelo, a lista de origens do CORS vinha direto da configuração, sem
validação. Dois erros comuns passavam silenciosamente até o navegador:

- `Cors__AllowedOrigins__0=*` combinado com `AllowCredentials()`: o ASP.NET Core
  proíbe a combinação e lança na primeira requisição, não no boot.
- Origem com barra final (`https://site.com/`): o header `Origin` do navegador
  nunca traz barra, então a origem não casa e o preflight é recusado. No servidor
  não aparece erro nenhum; o sintoma que chega é "o login não persiste".

## Decisão

**Três endpoints de saúde, com escopos distintos:**

| Rota | Checks executados | Uso |
| --- | --- | --- |
| `/health/live` | nenhum (`Predicate = _ => false`) | liveness probe |
| `/health/ready` | apenas os marcados com a tag `ready` (hoje, o banco) | readiness probe |
| `/health` | todos | healthcheck simples, compatibilidade |

O check de banco recebe a tag `ready`. Um check futuro que dependa de serviço
externo (cache, fila) entra com a mesma tag e passa a valer para o readiness sem
tocar no liveness.

**CORS validado no startup** por `CorsOptions : IValidatableObject`, registrado
com `ValidateOnStart()`. A validação recusa:

- `*`, porque com `AllowCredentials` a combinação lança em runtime;
- entrada vazia;
- URL não absoluta ou que não seja `http`/`https`;
- origem com caminho ou barra final.

A mensagem de erro cita a origem problemática e a correção esperada.

## Consequências

**Positivas**

- Banco fora do ar deixa de provocar reinício em cascata: o readiness sai do
  balanceador (503) e o liveness continua 200.
- Erro de CORS vira erro de boot, com a origem na mensagem — em vez de um
  sintoma de login que não persiste.
- O comportamento fica provado por teste: `HealthEndpointsTests` sobe uma API
  apontando para uma porta sem ninguém escutando e verifica 200 em
  `/health/live` e 503 em `/health/ready`, sem precisar derrubar o Postgres da
  máquina.

**Negativas**

- Três rotas em vez de uma: quem configura o orquestrador precisa escolher a
  certa. Mitigado pela documentação no README e no `.env.example`.
- `IValidatableObject` roda no boot e não a cada requisição, então uma origem
  alterada em runtime (sem restart) não é revalidada. Não é um cenário real:
  configuração vem de variável de ambiente.
- Uma origem válida mas errada (domínio que existe e não é o do front) continua
  passando. Validar formato não é validar intenção.

**Neutras**

- `/health` mantém o check completo de propósito, para não quebrar healthchecks
  já apontados para ele.
- O nome da tag (`ready`) é arbitrário; o que importa é que o liveness filtre
  por `_ => false` e nunca por exclusão — exclusão faria um check novo entrar no
  liveness por padrão.

## Alternativas consideradas

**Manter um único `/health` e configurar o orquestrador com `initialDelay` alto.**
Não resolve: o problema não é o tempo de subida, é o critério. Um banco que cai
depois de horas de operação continua disparando reinício.

**Deixar o liveness checar o banco, mas com timeout curto.**
Troca a frequência do problema, não a natureza. Além disso, um timeout curto
transforma lentidão do banco em reinício da API.

**Validar CORS na primeira requisição, com um filtro.**
Chegaria tarde: a primeira requisição é justamente o preflight que falha, e o
erro apareceria como 500 em vez de falha de boot. `ValidateOnStart` é o ponto
mais cedo possível.

**Normalizar a origem silenciosamente (remover a barra final em vez de recusar).**
Mais amigável, mas esconde o erro de configuração. Como o valor é escrito uma vez
por deploy, falhar alto e cedo custa menos do que um comportamento que "às vezes
funciona" e depende de qual campo o operador preencheu.
