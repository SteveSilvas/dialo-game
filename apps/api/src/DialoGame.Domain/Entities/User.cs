using DialoGame.Domain.Enums;

namespace DialoGame.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Único, case-insensitive. Comparado sempre em minúsculas.</summary>
    public string Username { get; set; } = string.Empty;

    /// <summary>Único quando presente. Sempre normalizado para minúsculas.</summary>
    public string? Email { get; set; }

    /// <summary>Nulo quando a conta foi criada apenas via Google.</summary>
    public string? PasswordHash { get; set; }

    public string? GoogleId { get; set; }

    public string? DisplayName { get; set; }

    public string? AvatarUrl { get; set; }

    public UserRole Role { get; set; } = UserRole.Student;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];

    public ICollection<ActivityProgress> Progress { get; set; } = [];
}
