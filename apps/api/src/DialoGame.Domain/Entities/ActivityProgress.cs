namespace DialoGame.Domain.Entities;

public class ActivityProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User? User { get; set; }

    public Guid ActivityId { get; set; }

    public Activity? Activity { get; set; }

    /// <summary>Melhor pontuação já obtida. Nunca regride.</summary>
    public int BestScore { get; set; }

    /// <summary>Total de tentativas enviadas.</summary>
    public int Attempts { get; set; }

    /// <summary>Erros na melhor tentativa.</summary>
    public int Errors { get; set; }

    /// <summary>0 a 3, calculado no servidor a partir da pontuação e dos erros.</summary>
    public int Stars { get; set; }

    /// <summary>Preenchido na primeira conclusão e não volta a nulo.</summary>
    public DateTimeOffset? CompletedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
