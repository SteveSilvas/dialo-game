using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Text.Json;
using DialoGame.Infrastructure.Persistence;
using DialoGame.Infrastructure.Persistence.Seed;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace DialoGame.Tests.Integration;

/// <summary>
/// Sobe a API real com um banco Postgres próprio por classe de teste. Não usa
/// InMemory nem mocks: os testes precisam exercitar o SQL, os índices únicos e o
/// <c>jsonb</c> que rodam em produção.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _databaseName = $"dialo_test_{Guid.NewGuid():N}";

    private string ConnectionString
    {
        get
        {
            // Reaproveita as credenciais do ambiente (CI ou .env local) e troca
            // apenas o banco, para cada classe de teste rodar isolada.
            var template = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
                ?? "Host=127.0.0.1;Port=5432;Database=dialo_game;Username=dialo;Password=dialo_dev";

            return Regex.Replace(template, @"(^|;)\s*Database\s*=[^;]*",
                $"$1Database={_databaseName}", RegexOptions.IgnoreCase);
        }
    }

    public HttpClient CreateClientWithCookies() =>
        CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
            AllowAutoRedirect = false,
        });

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", ConnectionString);
        builder.UseSetting("Jwt:SigningKey", "chave-de-teste-com-mais-de-32-caracteres!!");
        builder.UseSetting("Jwt:Issuer", "dialo-game");
        builder.UseSetting("Jwt:Audience", "dialo-game-web");
        builder.UseSetting("ApplyMigrationsOnStartup", "false");
        builder.UseSetting("Google:ClientId", "client-id-de-teste");
        builder.UseSetting("RateLimiting:Enabled", "false");
        // Métricas fora por padrão pelo mesmo motivo do rate limit: teste que não
        // mede observabilidade não deve depender dela.
        builder.UseSetting("Metrics:Enabled", "false");
        builder.UseSetting("Auth:RefreshCookieSecure", "false");
    }

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DialoGameDbContext>();
        await db.Database.MigrateAsync();
        await ModuleSeeder.SeedAsync(db);
    }

    public new async Task DisposeAsync()
    {
        using (var scope = Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DialoGameDbContext>();
            await db.Database.EnsureDeletedAsync();
        }

        await base.DisposeAsync();
    }
}

public static class ApiTestExtensions
{
    public static async Task<JsonDocument> ReadJsonAsync(this HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content);
    }

    public static async Task<(HttpResponseMessage Response, JsonDocument Body)> PostJsonAsync(
        this HttpClient client,
        string url,
        object payload)
    {
        var response = await client.PostAsJsonAsync(url, payload);
        return (response, await response.ReadJsonAsync());
    }
}
