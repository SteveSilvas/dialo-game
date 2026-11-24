using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Metrics;
using DialoGame.Api.Metrics;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;

namespace DialoGame.Tests.Unit;

/// <summary>
/// Coleta o que o Meter emite, porque um <see cref="Counter{T}"/> não expõe o
/// valor acumulado — só quem escuta recebe as medidas.
/// </summary>
internal sealed class MetricCollector : IDisposable
{
    private readonly MeterListener _listener = new();
    public List<string> Collected { get; } = [];

    public MetricCollector(string meterName)
    {
        _listener.InstrumentPublished = (instrument, listener) =>
        {
            if (instrument.Meter.Name == meterName)
            {
                listener.EnableMeasurementEvents(instrument);
            }
        };

        _listener.SetMeasurementEventCallback<long>((instrument, value, tags, _) =>
        {
            var formatted = string.Join(
                ",",
                tags.ToArray().Select(t => $"{t.Key}={t.Value}"));

            Collected.Add($"{instrument.Name}={value}[{formatted}]");
        });

        _listener.Start();
    }

    public void Dispose() => _listener.Dispose();
}

public class DialoMetricsTests
{
    [Fact]
    public void LoginComSucessoEmiteMetricaComMetodoEResultado()
    {
        using var collector = new MetricCollector(DialoMetrics.MeterName);
        using var metrics = new DialoMetrics();

        metrics.RecordLogin("password", success: true);

        collector.Collected.Should().ContainSingle()
            .Which.Should().Be("dialo.auth.logins=1[method=password,result=success]");
    }

    [Fact]
    public void LoginComFalhaEmiteResultadoFailure()
    {
        using var collector = new MetricCollector(DialoMetrics.MeterName);
        using var metrics = new DialoMetrics();

        metrics.RecordLogin("google", success: false);

        collector.Collected.Should().ContainSingle()
            .Which.Should().Be("dialo.auth.logins=1[method=google,result=failure]");
    }

    [Fact]
    public void ErroEmiteRotaEStatus()
    {
        using var collector = new MetricCollector(DialoMetrics.MeterName);
        using var metrics = new DialoMetrics();

        metrics.RecordError("/modulos/{slug}", 500);

        collector.Collected.Should().ContainSingle()
            .Which.Should().Be("dialo.http.errors=1[route=/modulos/{slug},status_code=500]");
    }
}

public class MetricsMiddlewareTests
{
    private static HttpContext ContextWithRoute(string? rawText, int statusCode = 200)
    {
        var context = new DefaultHttpContext();
        if (rawText is not null)
        {
            context.SetEndpoint(new RouteEndpoint(
                _ => Task.CompletedTask,
                RoutePatternFactory.Parse(rawText),
                order: 0,
                new EndpointMetadataCollection(),
                displayName: rawText));
        }

        context.Response.StatusCode = statusCode;
        return context;
    }

    [Fact]
    public async Task ContaErro500ComTemplateDaRota()
    {
        using var collector = new MetricCollector(DialoMetrics.MeterName);
        using var metrics = new DialoMetrics();
        var context = ContextWithRoute("/modulos/{slug}", 500);
        var middleware = new MetricsMiddleware(_ => Task.CompletedTask, metrics);

        await middleware.InvokeAsync(context);

        collector.Collected.Should().ContainSingle().Which
            .Should().Be("dialo.http.errors=1[route=/modulos/{slug},status_code=500]");
    }

    [Fact]
    public async Task NaoContaSucessoNemErroDeCliente()
    {
        using var collector = new MetricCollector(DialoMetrics.MeterName);
        using var metrics = new DialoMetrics();
        var middleware = new MetricsMiddleware(_ => Task.CompletedTask, metrics);

        await middleware.InvokeAsync(ContextWithRoute("/auth/login", 200));
        await middleware.InvokeAsync(ContextWithRoute("/auth/login", 401));
        await middleware.InvokeAsync(ContextWithRoute("/auth/login", 404));

        collector.Collected.Should().BeEmpty();
    }

    [Fact]
    public async Task ContaErroDeExcecaoAntesDeRelancar()
    {
        using var collector = new MetricCollector(DialoMetrics.MeterName);
        using var metrics = new DialoMetrics();
        var context = ContextWithRoute("/catalogo/modulos");
        var middleware = new MetricsMiddleware(
            _ => throw new InvalidOperationException("falhou"), metrics);

        await middleware.Invoking(m => m.InvokeAsync(context))
            .Should().ThrowAsync<InvalidOperationException>();

        collector.Collected.Should().ContainSingle().Which
            .Should().Be("dialo.http.errors=1[route=/catalogo/modulos,status_code=500]");
    }

    [Fact]
    public async Task SemRotaUsaRotuloFixo()
    {
        using var collector = new MetricCollector(DialoMetrics.MeterName);
        using var metrics = new DialoMetrics();
        var middleware = new MetricsMiddleware(_ => Task.CompletedTask, metrics);

        await middleware.InvokeAsync(ContextWithRoute(null, 503));

        // Caminho bruto como rótulo seria cardinalidade sem limite.
        collector.Collected.Should().ContainSingle().Which
            .Should().Be("dialo.http.errors=1[route=sem-rota,status_code=503]");
    }
}

public class ScrapeEndpointTests
{
    private static HttpContext Context(string path)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        return context;
    }

    [Theory]
    [InlineData("/metrics", true)]
    [InlineData("/metrics/", true)]
    [InlineData("/METRICS", true)]
    [InlineData("/metricsx", false)]
    [InlineData("/health", false)]
    public void ComparaCaminhoNormalizado(string path, bool expected) =>
        ScrapeEndpoint.Matches(Context(path), new MetricsOptions())
            .Should().Be(expected);

    [Fact]
    public void RespeitaCaminhoConfigurado()
    {
        var options = new MetricsOptions { Path = "/interno/metricas" };

        ScrapeEndpoint.Matches(Context("/interno/metricas"), options).Should().BeTrue();
        ScrapeEndpoint.Matches(Context("/metrics"), options).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("/")]
    public void CaminhoInvalidoNaoCasaNadaNemLanca(string? configured)
    {
        // Roda a cada requisição: explodir aqui derrubaria o pipeline inteiro, e um
        // "/" normalizado para vazio passaria a casar com a raiz do site.
        var options = new MetricsOptions { Path = configured! };

        var act = () => ScrapeEndpoint.Matches(Context("/metrics"), options);

        act.Should().NotThrow();
        ScrapeEndpoint.Matches(Context("/"), options).Should().BeFalse();
    }

    [Theory]
    [InlineData("/metrics", true)]
    [InlineData("/metrics/", true)]
    [InlineData("/interno/metricas", true)]
    [InlineData("/", false)]
    [InlineData("", false)]
    [InlineData("metrics", false)]
    public void ValidacaoRejeitaCaminhoSemSegmento(string path, bool valid)
    {
        // ValidateOnStart faz a API não subir com caminho inválido, em vez de
        // registrar um endpoint que nunca casa.
        var options = new MetricsOptions { Path = path };
        var results = new List<ValidationResult>();

        Validator.TryValidateObject(options, new ValidationContext(options), results, true)
            .Should().Be(valid);
    }
}
