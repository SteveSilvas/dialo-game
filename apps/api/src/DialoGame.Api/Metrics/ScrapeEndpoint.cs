namespace DialoGame.Api.Metrics;

/// <summary>
/// Regras do endpoint de scrape, compartilhadas entre a ramificação do pipeline e o
/// middleware de token.
/// </summary>
internal static class ScrapeEndpoint
{
    /// <summary>
    /// <c>true</c> quando a requisição é para a rota de métricas. Compara o caminho
    /// já normalizado, para que <c>/metrics/</c> e <c>/metrics</c> tenham o mesmo
    /// destino e um proxy com barra final não caia no 404.
    /// </summary>
    public static bool Matches(HttpContext context, MetricsOptions options)
    {
        var path = context.Request.Path.Value?.TrimEnd('/');
        // Opção vazia não pode explodir dentro do predicado do pipeline, que roda a
        // cada requisição: sem caminho válido, nada casa.
        var target = options.Path?.TrimEnd('/');
        return !string.IsNullOrEmpty(target) && string.Equals(path, target, StringComparison.OrdinalIgnoreCase);
    }
}
