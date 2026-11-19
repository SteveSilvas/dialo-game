namespace DialoGame.Domain.Entities;

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User? User { get; set; }

    /// <summary>SHA-256 do token. O token em claro nunca é persistido.</summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>
    /// Identifica a cadeia de rotações. Reusar um token já revogado revoga
    /// toda a família, o que detecta roubo de token.
    /// </summary>
    public Guid FamilyId { get; set; } = Guid.NewGuid();

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public string? UserAgent { get; set; }

    public bool IsActive => RevokedAt is null && ExpiresAt > DateTimeOffset.UtcNow;
}
