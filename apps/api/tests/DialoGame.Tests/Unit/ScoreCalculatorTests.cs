using DialoGame.Infrastructure.Services;
using FluentAssertions;

namespace DialoGame.Tests.Unit;

public class ScoreCalculatorTests
{
    [Theory]
    [InlineData(10, 0, 3)]
    [InlineData(9, 1, 2)]
    [InlineData(8, 2, 2)]
    [InlineData(5, 5, 1)]
    [InlineData(4, 6, 0)]
    [InlineData(0, 5, 0)]
    [InlineData(0, 0, 0)]
    public void CalculaEstrelasPelaPrecisao(int acertos, int erros, int esperado)
    {
        ScoreCalculator.CalculateStars(acertos, erros).Should().Be(esperado);
    }

    [Fact]
    public void ErrosNegativosSaoTratadosComoZero()
    {
        ScoreCalculator.CalculateStars(5, -3).Should().Be(3);
    }

    [Fact]
    public void SemAcertosNaoConcedeEstrela()
    {
        ScoreCalculator.CalculateStars(0, 0).Should().Be(0);
    }

    [Fact]
    public void MelhorPontuacaoSubstituiOsErros()
    {
        var (score, errors) = ScoreCalculator.MergeBestAttempt(3, 5, 10, 0);

        score.Should().Be(10);
        errors.Should().Be(0);
    }

    [Fact]
    public void PontuacaoPiorNaoAlteraNada()
    {
        var (score, errors) = ScoreCalculator.MergeBestAttempt(10, 0, 3, 7);

        score.Should().Be(10);
        errors.Should().Be(0);
    }

    [Fact]
    public void EmpateMantemOsMenoresErros()
    {
        // Regressão: reenviar a mesma nota com mais erros não pode piorar o
        // registro, senão os erros deixam de corresponder à melhor tentativa.
        var (score, errors) = ScoreCalculator.MergeBestAttempt(5, 1, 5, 4);

        score.Should().Be(5);
        errors.Should().Be(1);
    }

    [Fact]
    public void EmpateComMenosErrosMelhora()
    {
        var (score, errors) = ScoreCalculator.MergeBestAttempt(5, 4, 5, 0);

        score.Should().Be(5);
        errors.Should().Be(0);
    }

    [Fact]
    public void ErrosNegativosNaNovaTentativaViramZero()
    {
        var (_, errors) = ScoreCalculator.MergeBestAttempt(0, 0, 5, -3);

        errors.Should().Be(0);
    }
}
