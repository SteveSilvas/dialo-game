using DialoGame.Api.Contracts;
using DialoGame.Api.Logging;
using DialoGame.Tests.Integration;
using FluentAssertions;
using Serilog;
using Serilog.Core;
using Serilog.Events;

namespace DialoGame.Tests.Unit;

/// <summary>
/// A política de destructuring é a última barreira antes de um DTO de requisição
/// virar texto no log. Estes testes cobrem o que ela promete: senha e token nunca
/// aparecem, e-mail aparece mascarado.
/// </summary>
public class SensitiveDataDestructuringPolicyTests
{
    private static (InMemorySink Sink, ILogger Logger) CreateLogger()
    {
        var sink = new InMemorySink();
        var logger = new LoggerConfiguration()
            .Destructure.With<SensitiveDataDestructuringPolicy>()
            .WriteTo.Sink(sink)
            .CreateLogger();

        return (sink, logger);
    }

    private static string Render(LogEvent logEvent)
    {
        using var writer = new StringWriter();
        logEvent.RenderMessage(writer, formatProvider: null);

        foreach (var property in logEvent.Properties)
        {
            writer.Write($" {property.Key}={property.Value}");
        }

        return writer.ToString();
    }

    [Fact]
    public void SenhaDoCadastroNaoChegaAoLog()
    {
        var (sink, logger) = CreateLogger();
        var body = new RegisterBody("steve", "steve@exemplo.com", "SenhaSuperSecreta123");

        logger.Information("Cadastro recebido: {@Body}", body);

        var rendered = Render(sink.Events.Single());
        rendered.Should().NotContain("SenhaSuperSecreta123");
        rendered.Should().Contain("***");
    }

    [Fact]
    public void SenhaDoLoginNaoChegaAoLog()
    {
        var (sink, logger) = CreateLogger();
        var body = new LoginBody("steve@exemplo.com", "OutraSenhaSecreta456");

        logger.Information("Login recebido: {@Body}", body);

        Render(sink.Events.Single()).Should().NotContain("OutraSenhaSecreta456");
    }

    [Fact]
    public void TokenDoGoogleNaoChegaAoLog()
    {
        var (sink, logger) = CreateLogger();
        var body = new GoogleLoginBody("eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.token-do-google");

        logger.Information("Google recebido: {@Body}", body);

        var rendered = Render(sink.Events.Single());
        rendered.Should().NotContain("token-do-google");
        rendered.Should().Contain("IdToken");
    }

    [Fact]
    public void EmailApareceMascaradoNuncaInteiro()
    {
        var (sink, logger) = CreateLogger();
        var body = new RegisterBody("steve", "steve@exemplo.com", "SenhaSuperSecreta123");

        logger.Information("Cadastro recebido: {@Body}", body);

        var rendered = Render(sink.Events.Single());
        rendered.Should().NotContain("steve@exemplo.com");
        rendered.Should().Contain("s***@exemplo.com");
    }

    [Fact]
    public void UsernameContinuaVisivelParaDiagnostico()
    {
        var (sink, logger) = CreateLogger();
        var body = new RegisterBody("steve", null, "SenhaSuperSecreta123");

        logger.Information("Cadastro recebido: {@Body}", body);

        // Mascarar tudo tornaria o log inútil: o username identifica a conta sem
        // ser credencial nem dado pessoal sensível.
        Render(sink.Events.Single()).Should().Contain("steve");
    }

    [Theory]
    [InlineData("steve@exemplo.com", "s***@exemplo.com")]
    [InlineData("a@b.co", "***")]
    [InlineData("sem-arroba", "***")]
    [InlineData("", "***")]
    public void MascaraEmailPreservaDominio(string entrada, string esperado)
    {
        SensitiveDataDestructuringPolicy.MaskEmail(entrada).Should().Be(esperado);
    }

    [Fact]
    public void TipoForaDoProjetoNaoEhReescrito()
    {
        var (sink, logger) = CreateLogger();

        // A política só age em tipos do projeto; reescrever tipos do framework
        // quebraria a renderização de propriedades conhecidas.
        logger.Information("Rota {Path}", "/catalog/modules");

        Render(sink.Events.Single()).Should().Contain("/catalog/modules");
    }
}
