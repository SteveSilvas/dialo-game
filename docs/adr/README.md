# Architecture Decision Records

Decisões de arquitetura do DIALO GAME, no formato [ADR](https://adr.github.io/).

Cada registro é imutável depois de aceito: para mudar uma decisão, cria-se um novo ADR
que substitui o anterior. O histórico de por que algo foi decidido vale tanto quanto a
decisão em si.

| # | Decisão | Status | Data |
| --- | --- | --- | --- |
| [0001](0001-stack-backend.md) | Stack do backend: .NET 10 + EF Core | Aceito | 2026-11-19 |

## Quando criar um ADR

Crie um quando a decisão for **difícil de reverter** ou quando alguém razoavelmente
perguntaria "por que fizeram assim?". Exemplos: escolha de stack, modelo de
autenticação, estratégia de deploy, formato de dados que já está em produção.

Não crie para decisões locais e reversíveis — nome de variável, organização de pasta,
biblioteca de formatação.

## Formato

`NNNN-titulo-curto.md`, numerado em sequência. Seções: contexto, decisão,
consequências (positivas, negativas e neutras) e alternativas consideradas.
