namespace DialoGame.Api.Logging;

/// <summary>
/// Configuração do log estruturado. O <c>Enabled</c> existe pelo mesmo motivo do
/// <c>RateLimiting:Enabled</c>: testes que não medem log não devem pagar por ele
/// nem depender de onde a saída vai parar.
/// </summary>
public class LoggingOptions
{
    public const string SectionName = "Logging:Structured";

    /// <summary>Liga o sink de console em JSON e o resumo por requisição.</summary>
    public bool Enabled { get; set; } = true;
}
