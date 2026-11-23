using System.Diagnostics.CodeAnalysis;
using Serilog.Core;
using Serilog.Events;

namespace DialoGame.Api.Logging;

/// <summary>
/// Impede que senha, token e e-mail completo cheguem ao log.
///
/// Um <c>Destructure</c> de objeto de requisição é a forma mais fácil de vazar
/// credencial sem perceber: <c>Log.Information("{Body}", body)</c> grava o DTO
/// inteiro. A proteção fica aqui, no caminho de serialização, e não em cada
/// chamada de log — assim uma chamada nova não reintroduz o vazamento.
///
/// O e-mail é mascarado em vez de removido: <c>steve@gmail.com</c> vira
/// <c>s***@gmail.com</c>, o que ainda permite reconhecer a conta em um
/// incidente sem guardar o endereço completo de uma criança.
/// </summary>
internal sealed class SensitiveDataDestructuringPolicy : IDestructuringPolicy
{
    private const string Mask = "***";

    private static readonly HashSet<string> SensitiveProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "password",
        "passwordhash",
        "newpassword",
        "currentpassword",
        "secret",
        "signingkey",
        "idtoken",
        "accesstoken",
        "refreshtoken",
        "token",
        "authorization",
        "cookie",
        "setcookie",
    };

    private static readonly HashSet<string> EmailProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "email",
        "emailaddress",
    };

    public bool TryDestructure(
        object value,
        ILogEventPropertyValueFactory propertyValueFactory,
        [NotNullWhen(true)] out LogEventPropertyValue? result)
    {
        var type = value.GetType();

        // Só tipos do próprio projeto. Aplicar a política a qualquer objeto
        // arrastaria tipos do framework (HttpContext, PathString) para dentro de
        // um StructureValue, perdendo fidelidade — e um grafo com ciclo recursaria
        // até estourar a pilha. Os DTOs de requisição são planos, então basta.
        if (type.Namespace is null || !type.Namespace.StartsWith("DialoGame.", StringComparison.Ordinal))
        {
            result = null;
            return false;
        }

        var properties = new List<LogEventProperty>();

        foreach (var property in type.GetProperties())
        {
            if (property.GetIndexParameters().Length > 0 || property.GetMethod is null)
            {
                continue;
            }

            object? raw;
            try
            {
                raw = property.GetValue(value);
            }
            catch (Exception ex) when (ex is not OutOfMemoryException)
            {
                // Um getter que lança não pode derrubar o log.
                continue;
            }

            var name = property.Name;

            if (SensitiveProperties.Contains(name))
            {
                properties.Add(new LogEventProperty(name, new ScalarValue(Mask)));
                continue;
            }

            // A máscara por valor, e não só por nome de campo, existe porque o
            // e-mail nem sempre chega em uma propriedade chamada "Email": no login
            // ele vem em "Identifier", que aceita usuário ou e-mail. Olhar só o
            // nome do campo deixava o endereço passar inteiro.
            if (raw is string text && (EmailProperties.Contains(name) || LooksLikeEmail(text)))
            {
                properties.Add(new LogEventProperty(name, new ScalarValue(MaskEmail(text))));
                continue;
            }

            properties.Add(new LogEventProperty(name, propertyValueFactory.CreatePropertyValue(raw, destructureObjects: true)));
        }

        result = new StructureValue(properties, type.Name);
        return true;
    }

    private static bool LooksLikeEmail(string value)
    {
        var at = value.IndexOf('@', StringComparison.Ordinal);
        if (at <= 0 || at == value.Length - 1)
        {
            return false;
        }

        var domain = value[(at + 1)..];
        return domain.Contains('.', StringComparison.Ordinal) && !domain.Contains(' ', StringComparison.Ordinal);
    }

    /// <summary>
    /// Mantém a primeira letra e o domínio. Endereço curto ou malformado não tem
    /// parte local útil para preservar, então vira máscara inteira.
    /// </summary>
    internal static string MaskEmail(string email)
    {
        var at = email.IndexOf('@', StringComparison.Ordinal);
        if (at <= 1)
        {
            return Mask;
        }

        return $"{email[0]}{Mask}{email[at..]}";
    }
}
