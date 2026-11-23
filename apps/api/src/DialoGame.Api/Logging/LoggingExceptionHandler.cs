using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace DialoGame.Api.Logging;

/// <summary>
/// Registra a exceção que o <c>AddProblemDetails</c> transforma em resposta.
///
/// Sem isso o cliente recebe um 500 e o servidor não guarda nada: o
/// <c>UseExceptionHandler</c> responde, mas não escreve no log. A rota, o método
/// e o request id são gravados aqui porque são exatamente o que falta para
/// reproduzir o erro a partir de uma linha de log.
/// </summary>
internal sealed class LoggingExceptionHandler(ILogger<LoggingExceptionHandler> logger) : IExceptionHandler
{
    public ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        logger.LogError(
            exception,
            "Exceção não tratada em {Method} {Path}. Status {StatusCode}. RequestId {RequestId}",
            httpContext.Request.Method,
            httpContext.Request.Path.Value,
            StatusCodes.Status500InternalServerError,
            httpContext.TraceIdentifier);

        // false: a resposta continua sendo montada pelo ProblemDetails.
        return ValueTask.FromResult(false);
    }
}
