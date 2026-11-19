using System.ComponentModel.DataAnnotations;

namespace DialoGame.Infrastructure.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";

    [Required]
    public string Issuer { get; set; } = "dialo-game";

    [Required]
    public string Audience { get; set; } = "dialo-game-web";

    [Required]
    [MinLength(32, ErrorMessage = "A chave de assinatura precisa de ao menos 32 caracteres.")]
    public string SigningKey { get; set; } = string.Empty;

    [Range(1, 240)]
    public int AccessTokenMinutes { get; set; } = 15;

    [Range(1, 90)]
    public int RefreshTokenDays { get; set; } = 7;
}
