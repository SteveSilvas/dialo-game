namespace DialoGame.Infrastructure.Options;

public class AuthOptions
{
    public const string SectionName = "Auth";

    /// <summary>
    /// Marca o cookie de refresh como <c>Secure</c>. Fica em configuração porque
    /// testes e desenvolvimento rodam em http, onde um cookie Secure nunca seria
    /// enviado — e a suíte passaria a medir o ambiente, não a regra de negócio.
    /// Em produção precisa ser <c>true</c>.
    /// </summary>
    public bool RefreshCookieSecure { get; set; } = true;

    public string RefreshCookiePath { get; set; } = "/auth";
}
