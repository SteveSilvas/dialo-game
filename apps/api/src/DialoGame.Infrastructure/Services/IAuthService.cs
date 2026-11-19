using DialoGame.Domain.Entities;

namespace DialoGame.Infrastructure.Services;

public record RegisterRequest(string Username, string? Email, string Password);

public record LoginRequest(string Identifier, string Password, string? UserAgent);

public record GoogleLoginRequest(string IdToken, string? UserAgent);

public interface IAuthService
{
    Task<(AuthOutcome Outcome, User? User)> RegisterAsync(RegisterRequest request, string? userAgent, CancellationToken ct = default);

    Task<(AuthOutcome Outcome, User? User)> LoginAsync(LoginRequest request, CancellationToken ct = default);

    Task<(AuthOutcome Outcome, User? User)> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken ct = default);

    Task<(AuthOutcome Outcome, User? User)> RefreshAsync(string? refreshToken, string? userAgent, CancellationToken ct = default);

    Task RevokeAsync(string? refreshToken, CancellationToken ct = default);

    Task<User?> GetUserAsync(Guid userId, CancellationToken ct = default);
}
