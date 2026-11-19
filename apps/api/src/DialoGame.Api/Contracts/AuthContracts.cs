using System.ComponentModel.DataAnnotations;

namespace DialoGame.Api.Contracts;

// Em records posicionais a validação precisa ficar no parâmetro do construtor;
// com [property: ...] o MVC ignora as regras silenciosamente.
public record RegisterBody(
    [Required, StringLength(20, MinimumLength = 3)]
    [RegularExpression("^[a-zA-Z0-9_]+$",
        ErrorMessage = "O username aceita apenas letras, números e underscore.")]
    string Username,

    [EmailAddress, StringLength(254)]
    string? Email,

    [Required]
    string Password);

public record LoginBody(
    [Required] string Identifier,
    [Required] string Password);

public record GoogleLoginBody([Required] string IdToken);

public record UserResponse(
    Guid Id,
    string Username,
    string? Email,
    string? DisplayName,
    string? AvatarUrl,
    string Role,
    DateTimeOffset CreatedAt);

public record AuthResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    UserResponse User);
