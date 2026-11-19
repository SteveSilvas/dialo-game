using System.ComponentModel.DataAnnotations;

namespace DialoGame.Infrastructure.Options;

public class GoogleOptions
{
    public const string SectionName = "Google";

    /// <summary>Client id do Google Identity Services. Vazio desativa o login Google.</summary>
    public string ClientId { get; set; } = string.Empty;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(ClientId);
}
