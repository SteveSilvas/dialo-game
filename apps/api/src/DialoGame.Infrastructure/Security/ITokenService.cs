using DialoGame.Domain.Entities;

namespace DialoGame.Infrastructure.Security;

public record AccessToken(string Value, DateTimeOffset ExpiresAt);

public interface ITokenService
{
    AccessToken CreateAccessToken(User user);

    /// <summary>Gera um refresh token opaco e devolve o valor em claro e o hash para persistir.</summary>
    (string Plain, string Hash) CreateRefreshToken();

    string HashRefreshToken(string plainToken);
}
