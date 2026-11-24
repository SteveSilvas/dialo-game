using System.ComponentModel.DataAnnotations;

namespace DialoGame.Api.Metrics;

/// <summary>
/// Configuração da coleta de métricas. O <c>Enabled</c> segue o mesmo padrão do
/// <c>RateLimiting:Enabled</c> e do <c>Logging:Structured:Enabled</c>: testes que
/// não medem métrica não devem pagar por ela.
/// </summary>
public class MetricsOptions
{
    public const string SectionName = "Metrics";

    /// <summary>Liga a coleta e o endpoint <c>/metrics</c>.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Token exigido no header <c>Authorization: Bearer</c>. Sem token configurado o
    /// endpoint **não** é publicado: métrica aberta revela tráfego, rotas e volume de
    /// login, o que é informação útil para quem procura alvo.
    /// </summary>
    public string? Token { get; set; }

    /// <summary>
    /// Rota do scrape. Configurável para não colidir com um proxy.
    /// A validação existe porque a comparação de caminho normaliza a barra final:
    /// <c>"/"</c> viraria string vazia e o endpoint responderia na raiz.
    /// </summary>
    [Required]
    [RegularExpression(@"^/(?:[^/]+/)*[^/]+/?$",
        ErrorMessage = "Metrics:Path precisa começar com '/' e ter um segmento nomeado.")]
    public string Path { get; set; } = "/metrics";
}
