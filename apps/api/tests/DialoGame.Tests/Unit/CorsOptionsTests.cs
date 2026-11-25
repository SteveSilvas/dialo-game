using System.ComponentModel.DataAnnotations;
using DialoGame.Infrastructure.Options;
using FluentAssertions;

namespace DialoGame.Tests.Unit;

/// <summary>
/// A lista de origens é validada no startup porque, em runtime, uma origem errada
/// não gera erro: o navegador só recusa o preflight e o sintoma que chega é
/// "o login não persiste", sem apontar para o CORS.
/// </summary>
public class CorsOptionsTests
{
    private static IReadOnlyList<ValidationResult> Validate(params string[] origins) =>
        new CorsOptions { AllowedOrigins = origins }
            .Validate(new ValidationContext(new CorsOptions()))
            .ToList();

    [Theory]
    [InlineData("http://localhost:5173")]
    [InlineData("https://dialo.seudominio.com.br")]
    [InlineData("https://dialo.seudominio.com.br:8443")]
    public void OrigemValidaPassa(string origin) =>
        Validate(origin).Should().BeEmpty();

    [Fact]
    public void ListaVaziaPassa() =>
        Validate().Should().BeEmpty();

    [Fact]
    public void CuringaERecusado()
    {
        // AllowAnyOrigin e AllowCredentials são exclusivos no ASP.NET Core: aceitar
        // o curinga aqui trocaria um erro de boot por um throw na primeira requisição.
        var errors = Validate("*");

        errors.Should().ContainSingle()
            .Which.ErrorMessage.Should().Contain("AllowCredentials");
    }

    [Theory]
    [InlineData("localhost:5173")]
    [InlineData("dialo.seudominio.com.br")]
    [InlineData("ftp://dialo.seudominio.com.br")]
    public void OrigemSemEsquemaHttpOuRelativaERecusada(string origin) =>
        Validate(origin).Should().ContainSingle()
            .Which.ErrorMessage.Should().Contain("URL absoluta");

    [Theory]
    [InlineData("https://dialo.seudominio.com.br/")]
    [InlineData("https://dialo.seudominio.com.br/app")]
    public void OrigemComBarraFinalOuCaminhoERecusada(string origin)
    {
        // O header Origin nunca traz barra final, então "https://site/" não casa
        // com nada. Recusar no boot evita depurar isso em produção.
        var errors = Validate(origin);

        errors.Should().ContainSingle()
            .Which.ErrorMessage.Should().Contain("barra final");
    }

    [Fact]
    public void EntradaVaziaERecusada() =>
        Validate("").Should().ContainSingle()
            .Which.ErrorMessage.Should().Contain("vazia");
}
