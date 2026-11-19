namespace DialoGame.Infrastructure.Services;

/// <summary>
/// Estrelas são derivadas da precisão, não enviadas pelo cliente. Assim o front
/// não consegue conceder 3 estrelas a si mesmo.
/// </summary>
public static class ScoreCalculator
{
    public const int MaxStars = 3;

    /// <summary>
    /// Calcula 0 a 3 estrelas a partir dos acertos e erros. A precisão é
    /// acertos / (acertos + erros); sem nenhuma tentativa válida, 0 estrelas.
    /// </summary>
    public static int CalculateStars(int correctHits, int errors)
    {
        if (correctHits <= 0)
        {
            return 0;
        }

        var total = correctHits + Math.Max(errors, 0);
        if (total == 0)
        {
            return 0;
        }

        var accuracy = (double)correctHits / total;

        return accuracy switch
        {
            >= 1.0 => 3,
            >= 0.8 => 2,
            >= 0.5 => 1,
            _ => 0,
        };
    }

    /// <summary>
    /// Escolhe a melhor tentativa entre a já registrada e a nova. Mais acertos
    /// vence; com a mesma pontuação, vence a que teve menos erros. Sem esse
    /// desempate, reenviar o mesmo resultado com mais erros degradaria o
    /// registro e os erros deixariam de corresponder à melhor tentativa.
    /// </summary>
    public static (int BestScore, int Errors) MergeBestAttempt(
        int currentBestScore,
        int currentErrors,
        int newBestScore,
        int newErrors)
    {
        var bestErrors = Math.Max(newErrors, 0);

        if (newBestScore > currentBestScore)
        {
            return (newBestScore, bestErrors);
        }

        if (newBestScore < currentBestScore)
        {
            return (currentBestScore, currentErrors);
        }

        return (currentBestScore, Math.Min(currentErrors, bestErrors));
    }
}
