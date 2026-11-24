using Microsoft.AspNetCore.Http;

namespace DialoGame.Api.Metrics;

/// <summary>
/// Conta as respostas 5xx por rota.
///
/// A instrumentação do ASP.NET Core já publica a duração por rota com o
/// <c>status_code</c> como atributo, então a taxa de erro *poderia* ser extraída de
/// lá. Um contador próprio existe porque alerta sobre erro não deveria depender de
/// uma query de histograma: o limiar fica legível na regra do coletor.
/// </summary>
internal sealed class MetricsMiddleware(RequestDelegate next, DialoMetrics metrics)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch
        {
            // A exceção sobe para o `UseExceptionHandler`, que responde 500. Contar
            // aqui, antes de relançar, é o que faz o erro aparecer na métrica mesmo
            // quando a resposta é montada por outro middleware.
            metrics.RecordError(RouteOf(context), StatusCodes.Status500InternalServerError);
            throw;
        }

        if (context.Response.StatusCode >= StatusCodes.Status500InternalServerError)
        {
            metrics.RecordError(RouteOf(context), context.Response.StatusCode);
        }
    }

    /// <summary>
    /// Usa o template da rota, nunca o caminho bruto: um 404 em
    /// <c>/qualquer-coisa</c> geraria uma série por caminho inventado, o que é
    /// cardinalidade sem limite — o jeito mais fácil de derrubar o coletor.
    /// </summary>
    private static string RouteOf(HttpContext context) =>
        context.GetEndpoint() is RouteEndpoint endpoint
            ? endpoint.RoutePattern.RawText ?? "desconhecida"
            : "sem-rota";
}
