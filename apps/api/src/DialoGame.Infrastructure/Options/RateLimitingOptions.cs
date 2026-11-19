using System.ComponentModel.DataAnnotations;

namespace DialoGame.Infrastructure.Options;

public class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    /// <summary>Desliga o limite. Usado apenas por testes que não medem throttling.</summary>
    public bool Enabled { get; set; } = true;

    [Range(1, 10000)]
    public int LoginPermitLimit { get; set; } = 10;

    [Range(1, 1440)]
    public int LoginWindowMinutes { get; set; } = 15;

    [Range(1, 10000)]
    public int RegisterPermitLimit { get; set; } = 5;

    [Range(1, 1440)]
    public int RegisterWindowMinutes { get; set; } = 60;
}
