using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;

namespace DialoGame.Tests.Integration;

public class AuthEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static string UniqueName() => $"user{Guid.NewGuid():N}"[..20];

    private async Task<HttpClient> AuthenticatedClientAsync(string username, string password)
    {
        var client = factory.CreateClientWithCookies();
        var (response, body) = await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var token = body.RootElement.GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task RegistroDevolve201ComUsuarioEToken()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();

        var (response, body) = await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        body.RootElement.GetProperty("accessToken").GetString().Should().NotBeNullOrEmpty();
        body.RootElement.GetProperty("user").GetProperty("username").GetString()
            .Should().Be(username.ToLowerInvariant());
    }

    [Fact]
    public async Task RegistroNaoDevolveSenhaNemHash()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();

        var response = await client.PostAsJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        var raw = await response.Content.ReadAsStringAsync();
        raw.Should().NotContain("SenhaForte123");
        raw.Should().NotContain("passwordHash");
        raw.Should().NotContain("argon2id");
    }

    [Fact]
    public async Task RegistroComUsernameDuplicadoDevolve409()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();
        var payload = new { username, email = $"{username}@example.com", password = "SenhaForte123" };

        await client.PostJsonAsync("/auth/register", payload);
        var (response, _) = await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"outro{username}@example.com",
            password = "SenhaForte123",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task RegistroComEmailDuplicadoDevolve409()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();
        var email = $"{username}@example.com";

        await client.PostJsonAsync("/auth/register", new { username, email, password = "SenhaForte123" });
        var (response, _) = await client.PostJsonAsync("/auth/register", new
        {
            username = UniqueName(),
            email,
            password = "SenhaForte123",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task UsernameEUnicoIgnorandoCaixa()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();

        await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        var (response, _) = await client.PostJsonAsync("/auth/register", new
        {
            username = username.ToUpperInvariant(),
            email = $"x{username}@example.com",
            password = "SenhaForte123",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task RegistroComSenhaFracaDevolve400()
    {
        var client = factory.CreateClientWithCookies();

        var (response, _) = await client.PostJsonAsync("/auth/register", new
        {
            username = UniqueName(),
            email = $"{Guid.NewGuid():N}@example.com",
            password = "12345678",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task LoginFuncionaPorUsernameEPorEmail()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();
        var email = $"{username}@example.com";
        await client.PostJsonAsync("/auth/register", new { username, email, password = "SenhaForte123" });

        var (byUsername, _) = await client.PostJsonAsync("/auth/login",
            new { identifier = username, password = "SenhaForte123" });
        var (byEmail, _) = await client.PostJsonAsync("/auth/login",
            new { identifier = email, password = "SenhaForte123" });

        byUsername.StatusCode.Should().Be(HttpStatusCode.OK);
        byEmail.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task LoginComSenhaErradaDevolve401()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();
        await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        var (response, _) = await client.PostJsonAsync("/auth/login",
            new { identifier = username, password = "senha-errada" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task LoginComSenhaVaziaDevolve400()
    {
        // Senha vazia é requisição malformada, não credencial inválida: o 400
        // vem da validação do contrato antes de qualquer consulta ao banco.
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();
        await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        var (response, _) = await client.PostJsonAsync("/auth/login",
            new { identifier = username, password = "" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task LoginDeUsuarioInexistenteDevolve401ComMensagemGenerica()
    {
        var client = factory.CreateClientWithCookies();

        var (response, body) = await client.PostJsonAsync("/auth/login",
            new { identifier = "ninguem_aqui", password = "SenhaForte123" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        body.RootElement.GetProperty("title").GetString().Should().Be("Credenciais inválidas");
    }

    [Fact]
    public async Task MeSemTokenDevolve401()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task MeComTokenDevolvePerfil()
    {
        var username = UniqueName();
        var client = await AuthenticatedClientAsync(username, "SenhaForte123");

        var response = await client.GetAsync("/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.ReadJsonAsync();
        body.RootElement.GetProperty("username").GetString().Should().Be(username.ToLowerInvariant());
    }

    [Fact]
    public async Task RefreshRotacionaERejeitaReuso()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();
        await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        var refresh = await client.PostAsync("/auth/refresh", null);
        refresh.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task RefreshSemCookieDevolve401()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsync("/auth/refresh", null);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    /// <summary>
    /// O navegador descarta `SameSite=None` que não venha com `Secure`. O
    /// cookie handler do HttpClient não aplica essa regra, então só o header
    /// revela o problema — sem este teste, o refresh quebrava em http e a
    /// suíte passava.
    /// </summary>
    [Fact]
    public async Task CookieDeRefreshNaoUsaSameSiteNoneSemSecure()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();

        var (response, _) = await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var setCookie = response.Headers
            .GetValues("Set-Cookie")
            .Single(cookie => cookie.StartsWith("dialo_refresh=", StringComparison.Ordinal));

        var usesSameSiteNone = setCookie.Contains("samesite=none", StringComparison.OrdinalIgnoreCase);
        var isSecure = setCookie.Contains("secure", StringComparison.OrdinalIgnoreCase);

        // A fábrica de testes roda com RefreshCookieSecure=false (http).
        isSecure.Should().BeFalse();
        usesSameSiteNone.Should().BeFalse(
            "SameSite=None sem Secure é descartado pelo navegador");
    }

    [Fact]
    public async Task LogoutInvalidaORefresh()
    {
        var client = factory.CreateClientWithCookies();
        var username = UniqueName();
        await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        var logout = await client.PostAsync("/auth/logout", null);
        logout.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var refresh = await client.PostAsync("/auth/refresh", null);
        refresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GoogleComTokenInvalidoDevolve401()
    {
        var client = factory.CreateClient();

        var (response, _) = await client.PostJsonAsync("/auth/google",
            new { idToken = "token-invalido" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
