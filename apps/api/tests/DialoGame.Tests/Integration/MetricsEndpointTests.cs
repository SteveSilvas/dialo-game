using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Exporter;

namespace DialoGame.Tests.Integration;

/// <summary>
/// Exercita o endpoint de scrape real. A <see cref="ApiFactory"/> desliga métricas
/// por padrão, como faz com rate limit, para os demais testes não dependerem de
/// configuração de observabilidade.
/// </summary>
public class MetricsEndpointTests : IClassFixture<MetricsEndpointTests.MetricsFactory>
{
    private const string Token = "token-de-scrape-de-teste";

    public class MetricsFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Metrics:Enabled", "true");
            builder.UseSetting("Metrics:Token", Token);

            // O exporter guarda a resposta do scrape por 5 s. Mantido em produção, é
            // o que evita N scrapers concorrentes custando N coletas; nos testes,
            // faria o segundo scrape devolver o corpo do primeiro.
            builder.ConfigureServices(services =>
                services.PostConfigure<PrometheusAspNetCoreOptions>(
                    options => options.ScrapeResponseCacheDurationMilliseconds = 0));
        }
    }

    private readonly MetricsFactory _factory;

    public MetricsEndpointTests(MetricsFactory factory) => _factory = factory;

    [Fact]
    public async Task SemTokenRetorna401()
    {
        var response = await _factory.CreateClient().GetAsync("/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Headers.WwwAuthenticate.ToString().Should().Contain("Bearer");
    }

    [Fact]
    public async Task TokenErradoRetorna401()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "chute");

        var response = await client.GetAsync("/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task EsquemaErradoRetorna401()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Token);

        var response = await client.GetAsync("/metrics");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task TokenCorretoDevolveFormatoPrometheus()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Token);

        var response = await client.GetAsync("/metrics");
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.Should().Contain("# HELP").And.Contain("target_info");
    }

    [Fact]
    public async Task ScrapeNaoPassaPelaAutenticacaoJwt()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Token);

        // Compara antes/depois em vez de exigir ausência: outros testes da classe
        // chamam rotas sem token e geram a série com result="none", então a métrica
        // nunca está vazia. Somar o contador isola o efeito do scrape.
        var antes = await AuthMetricCountAsync(client);
        await client.GetAsync("/metrics");
        var depois = await AuthMetricCountAsync(client);

        depois.Should().Be(antes,
            "o scrape é ramificado antes de UseAuthentication e não deve autenticar");
    }

    private static async Task<double> AuthMetricCountAsync(HttpClient client)
    {
        var body = await (await client.GetAsync("/metrics")).Content.ReadAsStringAsync();

        return body.Split('\n')
            .Where(line => line.StartsWith(
                "aspnetcore_authentication_authenticate_duration_seconds_count{",
                StringComparison.Ordinal))
            .Select(line => double.Parse(line[(line.LastIndexOf(' ') + 1)..],
                System.Globalization.CultureInfo.InvariantCulture))
            .Sum();
    }

    [Fact]
    public async Task LoginAposScrapeApareceNaMetrica()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Token);

        await client.PostAsJsonAsync("/auth/login", new
        {
            identifier = "ninguem-metrics",
            password = "SenhaForte123",
        });

        var body = await (await client.GetAsync("/metrics")).Content.ReadAsStringAsync();

        body.Should().Contain("dialo_auth_logins_total");
        body.Should().Contain("method=\"password\"");
        body.Should().Contain("result=\"failure\"");
    }
}
