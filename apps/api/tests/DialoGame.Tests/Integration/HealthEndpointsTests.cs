using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;

namespace DialoGame.Tests.Integration;

/// <summary>
/// Prova a separação entre liveness e readiness: um Postgres fora do ar precisa
/// tirar a API do balanceador sem fazer o orquestrador reiniciar o container —
/// reiniciar não conserta o banco e ainda derruba quem estava saudável.
/// </summary>
public class HealthEndpointsTests : IClassFixture<HealthEndpointsTests.HealthFactory>
{
    public class HealthFactory : ApiFactory;

    private readonly HealthFactory _factory;

    public HealthEndpointsTests(HealthFactory factory) => _factory = factory;

    [Fact]
    public async Task HealthCompletoReportaHealthy()
    {
        var response = await _factory.CreateClient().GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("Healthy");
    }

    [Fact]
    public async Task LivenessNaoDependeDoBanco()
    {
        // O readiness enxerga o banco; o liveness não pode. Com o banco derrubado,
        // o liveness precisa continuar 200 para o container não ser reiniciado.
        using var factory = new NoDatabaseFactory();
        var response = await factory.CreateClient().GetAsync("/health/live");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("Healthy");
    }

    [Fact]
    public async Task ReadinessFalhaQuandoOBancoEstaFora()
    {
        using var factory = new NoDatabaseFactory();
        var response = await factory.CreateClient().GetAsync("/health/ready");

        response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        (await response.Content.ReadAsStringAsync()).Should().Be("Unhealthy");
    }

    [Fact]
    public async Task ReadinessReportaHealthyComBancoNoAr()
    {
        var response = await _factory.CreateClient().GetAsync("/health/ready");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    /// <summary>
    /// Aponta para uma porta sem ninguém escutando. Não mexe no banco de
    /// desenvolvimento nem depende de derrubar o Postgres da máquina.
    /// </summary>
    private sealed class NoDatabaseFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting(
                "ConnectionStrings:Default",
                "Host=127.0.0.1;Port=1;Database=inexistente;Username=dialo;Password=dialo_dev");
        }
    }
}
