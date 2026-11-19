namespace DialoGame.Infrastructure.Security;

public record GooglePayload(
    string Subject,
    string Email,
    bool EmailVerified,
    string? Name,
    string? Picture);

public interface IGoogleTokenValidator
{
    /// <summary>
    /// Valida o <c>idToken</c> do Google Identity Services. Devolve nulo quando o
    /// token é inválido, expirado ou emitido para outro client id.
    /// </summary>
    Task<GooglePayload?> ValidateAsync(string idToken, CancellationToken ct = default);
}
