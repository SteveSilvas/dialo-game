# ADR 0002 — Métricas e destino do alerta

- **Status:** Aceito
- **Data:** 2026-11-18
- **Decisores:** Steve Silva
- **Issue:** [#57](https://github.com/SteveSilvas/dialo-game/issues/57)
- **Substitui:** —
- **Substituído por:** —

## Contexto

Até aqui a API só expunha `GET /health`, com `AddDbContextCheck`. Isso responde
"está de pé ou não" e mais nada: não dá para dizer se a API ficou mais lenta
hoje, qual rota concentra erro, nem quantas contas entraram na semana.

A issue #57 pede três medições — latência por rota, taxa de erro e contagem de
login — e um endpoint que um coletor consiga ler. Pede também que a decisão
sobre **onde o alerta dispara** fique registrada, e proíbe acoplar um provedor de
nuvem (Application Insights, Datadog) sem que o dono do repositório escolha.

Esse último ponto é o que dá forma à decisão: o projeto é de uma pessoa, roda em
container e não tem orçamento definido para observabilidade. Qualquer escolha
que amarre o código a um SaaS seria difícil de reverter e criaria uma conta
recorrente sem o dono ter pedido.

### Forças em jogo

| Força | Peso |
| --- | --- |
| Não acoplar provedor sem decisão do dono | Alto — restrição explícita |
| Formato que qualquer coletor leia | Alto — o critério de aceite |
| Custo de operação para um time de uma pessoa | Alto — sem plantão 24/7 |
| Correlacionar métrica com log | Médio — o `RequestId` do Serilog já existe |
| `TreatWarningsAsErrors` e versões centralizadas | Médio — regra do repositório |

## Decisão

**Medir com `System.Diagnostics.Metrics` e publicar em `/metrics`, no formato
Prometheus/OpenMetrics.** O destino do alerta fica no coletor, não no código.

### Coleta

- `OpenTelemetry.Extensions.Hosting` + `OpenTelemetry.Instrumentation.AspNetCore`
  fornecem latência por rota de graça: o histograma
  `http_server_request_duration_seconds` já vem com `http_route` e
  `http_response_status_code` como rótulos.
- Um `Meter` próprio (`DialoGame`) publica o que a instrumentação não sabe:
  `dialo_auth_logins_total` (separando `method=password|google` e
  `result=success|failure`) e `dialo_http_errors_total` (5xx por rota).

### Por que um contador de erro separado

A taxa de erro *poderia* sair de uma query sobre o histograma
(`status_code >= 500`). O contador existe porque regra de alerta deve ser
legível sozinha: `rate(dialo_http_errors_total[5m]) > 0` se lê sem saber que
existe um histograma, e não depende de adivinhar buckets.

### Por que "logins por dia" não é um rótulo de data

A issue pede login contado por dia. Colocar a data como rótulo
(`dialo_auth_logins_total{dia="2026-11-18"}`) criaria uma série nova por dia,
para sempre — cardinalidade que cresce sem limite, o jeito mais comum de matar
um coletor. O contador é cumulativo, e o "por dia" sai da consulta:

```promql
# Logins com sucesso nas últimas 24 h, por método
sum by (method) (increase(dialo_auth_logins_total{result="success"}[24h]))

# Total de logins do dia corrente (00:00 UTC até agora)
sum(increase(dialo_auth_logins_total[1d]))
```

### Destino do alerta

**O alerta mora nas regras do coletor, versionadas junto do deploy.** O código
só publica números; quem decide "isso é ruim" é o Prometheus (ou qualquer
coletor compatível: VictoriaMetrics, Grafana Miroc, o agente do Grafana Cloud).

Essa separação é o que mantém o requisito de neutralidade: trocar de coletor não
toca em uma linha da API. As regras mínimas, para servirem de ponto de partida:

```yaml
groups:
  - name: dialo-api
    rules:
      - alert: DialoErroAlto
        # Mais de 1% das requisições virando 5xx em 5 min, com pelo menos
        # 1 erro, para não disparar em tráfego de teste.
        expr: |
          sum(rate(dialo_http_errors_total[5m]))
            /
          sum(rate(http_server_request_duration_seconds_count[5m])) > 0.01
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "Taxa de erro 5xx acima de 1% por 10 min"

      - alert: DialoLatenciaAlta
        # p95 acima de 1,5 s por 10 min. O bucket de 2,5 s do histograma
        # padrão cobre o limiar, então a estimativa não é grosseira.
        expr: |
          histogram_quantile(0.95,
            sum by (le) (rate(http_server_request_duration_seconds_bucket[5m]))
          ) > 1.5
        for: 10m
        labels:
          severity: warn
        annotations:
          summary: "p95 de latência acima de 1,5 s por 10 min"

      - alert: DialoApiForaDoAr
        expr: up{job="dialo-api"} == 0
        for: 5m
        labels:
          severity: page
        annotations:
          summary: "O scrape do /metrics falhou por 5 min"
```

O `severity: page` é intencionalmente vago: o roteamento (e-mail, Telegram,
push) é configuração do Alertmanager, e um projeto de uma pessoa provavelmente
vai começar só com notificação no celular. Trocar o destino é editar o
Alertmanager, não a API.

### Correlação com o log

O histograma e o contador não carregam `RequestId` — seria um rótulo com um
valor por requisição, cardinalidade explosiva. A correlação acontece pelo tempo
e pela rota: uma linha de log com `RequestId` traz `Path` e `StatusCode`, e a
métrica diz se aquela rota está pior que o normal. O `RequestId` está no log
desde a issue #56.

## Consequências

### Positivas

- Nenhum acoplamento a provedor: o mesmo `/metrics` serve Prometheus,
  VictoriaMetrics ou Grafana Cloud sem mudar código.
- Sem conta recorrente nem cartão de crédito para começar a medir.
- Latência por rota vem pronta da instrumentação oficial, sem código próprio.
- As regras de alerta ficam no repositório, versionadas, revisáveis em PR.

### Negativas

- Alguém precisa **subir um coletor**. Sozinha, a API não avisa ninguém: sem
  Prometheus e Alertmanager, os números existem e ninguém olha.
- O exporter do Prometheus **nunca saiu de pre-release** — todas as 39 versões
  são `-alpha`, `-beta` ou `-rc`. Fixamos `1.21.0-beta.1`. É o pacote oficial do
  projeto OpenTelemetry e a alternativa seria escrever o formato à mão, mas é
  uma dependência que pode mudar de API entre versões.
- O exporter guarda a resposta do scrape por 5 s
  (`ScrapeResponseCacheDurationMilliseconds`). É o que impede N scrapers
  concorrentes custarem N coletas, mas significa que um scrape logo após outro
  recebe o mesmo corpo — os testes de integração zeram esse cache.

### Neutras

- `/metrics` exige `Authorization: Bearer` e **não é publicado** quando
  `Metrics__Token` está vazio. Fechar por padrão evita que o mapa do tráfego
  (rotas, volume, taxa de erro) fique público por esquecimento.
- O endpoint é ramificado antes de `UseAuthentication`: o scrape não gasta uma
  verificação de JWT falha a cada coleta, e essas falhas não poluem as métricas
  de autenticação.
- Métricas desligam com `Metrics__Enabled=false`, como o rate limit e o log
  estruturado, para os testes não dependerem de observabilidade.

## Alternativas consideradas

**Application Insights.** Zero infraestrutura e ótimo para .NET, mas exige conta
Azure e um SDK que amarra o código ao provedor — exatamente o que a issue proíbe
sem o dono escolher.

**OTLP para um coletor externo.** Mais neutro ainda que Prometheus, porém exige
um processo extra (o OpenTelemetry Collector) para traduzir OTLP em algo que o
back-end entenda. Para um serviço só, o scrape HTTP direto tem menos peças.

**Só log estruturado, sem métricas.** O log já tem rota, status e duração por
requisição, então tecnicamente dá para calcular tudo consultando o log. Mas
consulta de log é cara e lenta, e não é o que responde "está mais lento agora?"
sem alguém montar a query na mão.

**Escrever o formato Prometheus à mão.** Eliminaria a dependência pre-release,
ao custo de manter à mão o escaping, os sufixos `_total`/`_bucket` e os
histogramas — trabalho que o exporter já faz e que erra em silêncio.
