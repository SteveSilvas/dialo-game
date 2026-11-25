using System.ComponentModel.DataAnnotations;

namespace DialoGame.Infrastructure.Options;

/// <summary>
/// Origens autorizadas a chamar a API pelo navegador. A lista é fechada de
/// propósito: o cookie de refresh viaja com <c>AllowCredentials</c>, e o CORS
/// proíbe combinar credenciais com origem curinga.
/// </summary>
public class CorsOptions : IValidatableObject
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; set; } = [];

    /// <summary>
    /// Valida no startup, não na primeira requisição. Uma origem mal escrita não
    /// gera erro em runtime: o navegador só recusa o preflight, e o sintoma que
    /// chega é "o login não persiste" — longe da causa.
    /// </summary>
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        foreach (var origin in AllowedOrigins)
        {
            if (string.IsNullOrWhiteSpace(origin))
            {
                yield return new ValidationResult(
                    "Cors:AllowedOrigins não aceita entrada vazia.", [nameof(AllowedOrigins)]);
                continue;
            }

            if (origin == "*")
            {
                // AllowAnyOrigin e AllowCredentials são mutuamente exclusivos no ASP.NET Core:
                // com o cookie de refresh, o curinga não é uma opção mais frouxa — é uma que
                // lança em runtime. Exigir a lista explícita resolve os dois casos.
                yield return new ValidationResult(
                    "Cors:AllowedOrigins não aceita '*': com AllowCredentials é preciso listar as origens.",
                    [nameof(AllowedOrigins)]);
                continue;
            }

            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                yield return new ValidationResult(
                    $"Cors:AllowedOrigins: '{origin}' não é uma URL absoluta http(s).",
                    [nameof(AllowedOrigins)]);
                continue;
            }

            // O navegador manda o header Origin sem barra final. "https://site.com/"
            // nunca casa, e o erro aparece só no preflight.
            if (uri.AbsolutePath != "/" || origin.EndsWith('/'))
            {
                yield return new ValidationResult(
                    $"Cors:AllowedOrigins: '{origin}' não pode ter caminho nem barra final; use '{origin.TrimEnd('/')}'.",
                    [nameof(AllowedOrigins)]);
            }
        }
    }
}
