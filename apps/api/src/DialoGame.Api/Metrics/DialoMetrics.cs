using System.Diagnostics.Metrics;

namespace DialoGame.Api.Metrics;

/// <summary>
/// Instrumentos de domínio, separados dos de infraestrutura.
///
/// Latência e taxa de erro por rota vêm do <c>AddAspNetCoreInstrumentation</c>, que
/// já emite <c>http.server.request.duration</c> com a rota como atributo. O que ele
/// não sabe é *como* o login foi feito — só vê um POST em <c>/auth/login</c>. Por
/// isso o contador de logins é próprio, com a origem separada.
/// </summary>
public sealed class DialoMetrics : IDisposable
{
    public const string MeterName = "DialoGame";

    private readonly Meter _meter;
    private readonly Counter<long> _logins;
    private readonly Counter<long> _errors;

    public DialoMetrics()
    {
        _meter = new Meter(MeterName, "1.0.0");
        _logins = _meter.CreateCounter<long>(
            "dialo.auth.logins",
            unit: "{login}",
            description: "Tentativas de login, separadas por origem e resultado.");
        _errors = _meter.CreateCounter<long>(
            "dialo.http.errors",
            unit: "{error}",
            description: "Respostas 5xx por rota.");
    }

    /// <summary>
    /// Conta uma tentativa de login. <paramref name="method"/> é <c>password</c> ou
    /// <c>google</c>; <paramref name="success"/> vira o rótulo <c>result</c>.
    /// </summary>
    public void RecordLogin(string method, bool success) =>
        _logins.Add(1, new KeyValuePair<string, object?>("method", method),
            new KeyValuePair<string, object?>("result", success ? "success" : "failure"));

    /// <summary>
    /// Conta uma resposta de erro. <paramref name="route"/> é o template da rota, não
    /// o caminho concreto: <c>/modulos/{slug}</c> e não <c>/modulos/silabas</c>.
    /// </summary>
    public void RecordError(string route, int statusCode) =>
        _errors.Add(1, new KeyValuePair<string, object?>("route", route),
            new KeyValuePair<string, object?>("status_code", statusCode));

    public void Dispose() => _meter.Dispose();
}
