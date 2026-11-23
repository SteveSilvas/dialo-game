using System.Net;
using DialoGame.Api.Contracts;
using DialoGame.Api.Logging;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Serilog;

namespace DialoGame.Tests.Integration;

/// <summary>
/// Prova o critério de aceite da #56 sobre o que realmente sai no log: uma
/// requisição normal deixa um resumo com status, e uma exceção não tratada deixa
/// um JSON com request id — sem senha, token ou e-mail completo.
/// </summary>
public class StructuredLoggingTests : IClassFixture<StructuredLoggingTests.LoggingFactory>
{
    public class LoggingFactory : ApiFactory
    {
        public JsonLogSink Sink { get; } = new();

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("Logging:Structured:Enabled", "true");

            // ReadFrom.Services descobre sinks registrados no DI, então o teste
            // observa exatamente o que o pipeline de produção emitiria.
            builder.ConfigureServices(services => services.AddSingleton<Serilog.Core.ILogEventSink>(Sink));
        }
    }

    private readonly LoggingFactory _factory;

    public StructuredLoggingTests(LoggingFactory factory) => _factory = factory;

    /// <summary>
    /// O resumo da requisição é escrito depois que a resposta chega ao cliente,
    /// então esperar a linha é parte do teste — não um sleep fixo.
    /// </summary>
    private async Task<string> WaitForLineAsync(string fragment)
    {
        for (var attempt = 0; attempt < 100; attempt++)
        {
            var match = _factory.Sink.Lines.FirstOrDefault(line => line.Contains(fragment, StringComparison.Ordinal));
            if (match is not null)
            {
                return match;
            }

            await Task.Delay(20);
        }

        _factory.Sink.Lines.Should().ContainMatch($"*{fragment}*",
            "a linha esperada deveria ter sido escrita em até 2 segundos");
        return string.Empty;
    }

    [Fact]
    public async Task RequisicaoNormalDeixaResumoComStatusEDuracao()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await WaitForLineAsync("\"RequestPath\":\"/health\"");

        summary.Should().Contain("\"StatusCode\":200");
        summary.Should().Contain("Elapsed");
    }

    [Fact]
    public async Task ResumoDaRequisicaoCarregaRequestId()
    {
        var client = _factory.CreateClient();

        // Rota própria: o fixture é compartilhado, e duas requisições na mesma rota
        // tornariam ambíguo qual linha pertence a este teste.
        var response = await client.GetAsync("/catalog");
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var summary = await WaitForLineAsync("\"RequestPath\":\"/catalog\"");

        summary.Should().Contain("RequestId");
        summary.Should().NotContain("\"RequestId\":null");
    }

    [Fact]
    public async Task ExcecaoNaoTratadaViraJsonComRequestId()
    {
        var sink = new JsonLogSink();
        using var loggerFactory = CreateLoggerFactory(sink);

        var handler = new LoggingExceptionHandler(loggerFactory.CreateLogger<LoggingExceptionHandler>());

        var context = new DefaultHttpContext();
        context.Request.Method = "POST";
        context.Request.Path = "/auth/login";
        context.TraceIdentifier = "request-id-de-teste";

        await handler.TryHandleAsync(context, new InvalidOperationException("falha proposital"), default);

        var line = sink.Lines.Should().ContainSingle().Subject;
        line.Should().StartWith("{", "o log de produção é JSON compacto");
        line.Should().Contain("request-id-de-teste");
        line.Should().Contain("/auth/login");
        line.Should().Contain("500");
        line.Should().Contain("falha proposital");
        line.Should().Contain("\"@x\":", "o formatter compacto grava a exceção em @x");
    }

    [Fact]
    public async Task ExcecaoEmRequisicaoComCredencialNaoVazaSenhaNemEmail()
    {
        var sink = new JsonLogSink();
        using var loggerFactory = CreateLoggerFactory(sink);
        var handler = new LoggingExceptionHandler(loggerFactory.CreateLogger<LoggingExceptionHandler>());

        var context = new DefaultHttpContext();
        context.TraceIdentifier = "id-2";

        // O DTO de login é o caso real de vazamento: ele carrega a senha e aceita
        // e-mail no campo Identifier.
        var body = new LoginBody("steve@exemplo.com", "SenhaQueNaoPodeVazar");
        loggerFactory.CreateLogger("Teste").LogInformation("Corpo rejeitado {@Body}", body);

        await handler.TryHandleAsync(context, new InvalidOperationException("boom"), default);

        var all = string.Join("\n", sink.Lines);
        all.Should().NotContain("SenhaQueNaoPodeVazar");
        all.Should().NotContain("steve@exemplo.com");
    }

    private static ILoggerFactory CreateLoggerFactory(JsonLogSink sink) =>
        LoggerFactory.Create(builder => builder.AddSerilog(
            new LoggerConfiguration()
                .Destructure.With<SensitiveDataDestructuringPolicy>()
                .WriteTo.Sink(sink)
                .CreateLogger(),
            dispose: true));
}
