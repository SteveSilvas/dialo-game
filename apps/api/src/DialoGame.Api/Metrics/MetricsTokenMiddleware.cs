using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace DialoGame.Api.Metrics;

/// <summary>
/// Exige <c>Authorization: Bearer &lt;token&gt;</c> no scrape.
///
/// A comparação é de tempo constante porque este token é comparado com um valor
/// secreto: uma comparação que sai no primeiro byte diferente vaza, pelo tempo de
/// resposta, quantos caracteres iniciais estão certos — o mesmo motivo de o
/// <see cref="Infrastructure.Services.AuthService"/> verificar o hash mesmo quando o
/// usuário não existe.
/// </summary>
internal sealed class MetricsTokenMiddleware(RequestDelegate next, IOptions<MetricsOptions> options)
{
    private const string Scheme = "Bearer ";

    public async Task InvokeAsync(HttpContext context)
    {
        var expected = options.Value.Token;

        // Sem token configurado o endpoint nem é publicado, mas se algum caminho
        // chegar aqui, negar é mais seguro que servir.
        if (string.IsNullOrEmpty(expected))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        var header = context.Request.Headers.Authorization.ToString();
        if (!header.StartsWith(Scheme, StringComparison.Ordinal)
            || !AlmostEquals(header[Scheme.Length..], expected))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.Headers.WWWAuthenticate = "Bearer realm=\"metrics\"";
            return;
        }

        await next(context);
    }

    /// <summary>
    /// Compara em tempo constante. O hash vem antes da comparação porque
    /// <see cref="CryptographicOperations.FixedTimeEquals"/> retorna na hora quando os
    /// tamanhos diferem — o que revelaria o comprimento do token. Com o SHA-256 dos
    /// dois lados, os buffers têm sempre 32 bytes e o tempo não depende do conteúdo.
    /// </summary>
    private static bool AlmostEquals(string provided, string expected) =>
        CryptographicOperations.FixedTimeEquals(
            SHA256.HashData(Encoding.UTF8.GetBytes(provided)),
            SHA256.HashData(Encoding.UTF8.GetBytes(expected)));
}
