namespace DialoGame.Domain.Entities;

public class Module
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Identificador estável usado na URL. Único.</summary>
    public string Slug { get; set; } = string.Empty;

    public int Order { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    /// <summary>Conceito de alfabetização trabalhado (ex.: princípio alfabético).</summary>
    public string Concept { get; set; } = string.Empty;

    public ICollection<Activity> Activities { get; set; } = [];
}
