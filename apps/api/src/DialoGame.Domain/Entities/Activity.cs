using System.Text.Json;
using DialoGame.Domain.Enums;

namespace DialoGame.Domain.Entities;

public class Activity
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ModuleId { get; set; }

    public Module? Module { get; set; }

    /// <summary>Identificador estável usado na URL. Único.</summary>
    public string Slug { get; set; } = string.Empty;

    public int Order { get; set; }

    public string Title { get; set; } = string.Empty;

    public ActivityType Type { get; set; }

    /// <summary>
    /// O que varia por atividade (alfabeto alvo, pares de rima, banco de palavras).
    /// Guardado como <c>jsonb</c> para não alterar o schema a cada atividade nova.
    /// </summary>
    public JsonDocument Config { get; set; } = JsonDocument.Parse("{}");

    /// <summary>Atividades obrigatórias contam para a conclusão do módulo.</summary>
    public bool IsRequired { get; set; } = true;
}
