using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DialoGame.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using FluentAssertions;

namespace DialoGame.Tests.Integration;

public class CatalogAndProgressTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private async Task<HttpClient> AuthenticatedClientAsync()
    {
        var client = factory.CreateClientWithCookies();
        var username = $"user{Guid.NewGuid():N}"[..20];

        var (response, body) = await client.PostJsonAsync("/auth/register", new
        {
            username,
            email = $"{username}@example.com",
            password = "SenhaForte123",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var token = body.RootElement.GetProperty("accessToken").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<JsonElement> GetModuleAsync(HttpClient client, string slug)
    {
        var response = await client.GetAsync("/catalog");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.ReadJsonAsync();
        return body.RootElement.GetProperty("modules")
            .EnumerateArray()
            .First(m => m.GetProperty("slug").GetString() == slug);
    }

    [Fact]
    public async Task CatalogoAnonimoDevolveModulo01ComCincoAtividades()
    {
        var client = factory.CreateClient();

        var module = await GetModuleAsync(client, "modulo-01");

        module.GetProperty("activities").GetArrayLength().Should().Be(5);
        module.GetProperty("requiredTotal").GetInt32().Should().Be(5);
        module.GetProperty("status").GetString().Should().Be("current");
    }

    [Fact]
    public async Task CatalogoAnonimoNaoTrazProgresso()
    {
        var client = factory.CreateClient();

        var module = await GetModuleAsync(client, "modulo-01");

        module.GetProperty("requiredCompleted").GetInt32().Should().Be(0);
        module.GetProperty("stars").GetInt32().Should().Be(0);
    }

    [Fact]
    public async Task SeedRodarDuasVezesNaoDuplicaAtividades()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DialoGameDbContext>();

        await DialoGame.Infrastructure.Persistence.Seed.ModuleSeeder.SeedAsync(db);
        await DialoGame.Infrastructure.Persistence.Seed.ModuleSeeder.SeedAsync(db);

        var modules = await db.Modules.Include(m => m.Activities).ToListAsync();
        modules.Should().HaveCount(1);
        modules[0].Activities.Should().HaveCount(5);
        modules[0].Activities.Select(a => a.Slug).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task ConfigDaAtividadeEPersistidoComoJsonb()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DialoGameDbContext>();

        var activity = await db.Activities.FirstAsync(a => a.Slug == "atividade-01");

        activity.Config.RootElement.GetProperty("predicate").GetString().Should().Be("letter");
    }

    [Fact]
    public async Task ProgressoExigeAutenticacao()
    {
        var client = factory.CreateClient();

        var response = await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 1,
            attempts = 1,
            errors = 0,
            completed = true,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProgressoSalvoSobreviveANovaSessao()
    {
        var client = await AuthenticatedClientAsync();

        var put = await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 3,
            attempts = 1,
            errors = 0,
            completed = true,
        });
        put.StatusCode.Should().Be(HttpStatusCode.OK);

        // Nova sessão para o mesmo usuário: o progresso vem do banco, não da memória.
        var module = await GetModuleAsync(client, "modulo-01");
        module.GetProperty("requiredCompleted").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task NotaMenorNaoRegride()
    {
        var client = await AuthenticatedClientAsync();

        await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 8,
            attempts = 1,
            errors = 0,
            completed = true,
        });

        var response = await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 2,
            attempts = 1,
            errors = 6,
            completed = true,
        });
        var body = await response.ReadJsonAsync();

        body.RootElement.GetProperty("bestScore").GetInt32().Should().Be(8);
        body.RootElement.GetProperty("stars").GetInt32().Should().Be(3);
    }

    [Fact]
    public async Task NotaMaiorAtualizaMelhorResultado()
    {
        var client = await AuthenticatedClientAsync();

        await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 3,
            attempts = 1,
            errors = 2,
            completed = true,
        });

        var response = await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 10,
            attempts = 1,
            errors = 0,
            completed = true,
        });
        var body = await response.ReadJsonAsync();

        body.RootElement.GetProperty("bestScore").GetInt32().Should().Be(10);
        body.RootElement.GetProperty("stars").GetInt32().Should().Be(3);
    }

    [Fact]
    public async Task EstrelasSaoCalculadasNoServidorIgnorandoOCliente()
    {
        var client = await AuthenticatedClientAsync();

        // Cliente tenta se dar 3 estrelas com metade de erro: o servidor recalcula.
        var response = await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 5,
            attempts = 1,
            errors = 5,
            completed = true,
            stars = 3,
        });
        var body = await response.ReadJsonAsync();

        body.RootElement.GetProperty("stars").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task AtividadeInexistenteDevolve404()
    {
        var client = await AuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/progress/activities/nao-existe", new
        {
            bestScore = 1,
            attempts = 1,
            errors = 0,
            completed = true,
        });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CompletarTodasAsAtividadesConcluiOModulo()
    {
        var client = await AuthenticatedClientAsync();
        var slugs = new[] { "atividade-01", "atividade-02", "atividade-03", "atividade-04", "atividade-05" };

        foreach (var slug in slugs)
        {
            var response = await client.PutAsJsonAsync($"/progress/activities/{slug}", new
            {
                bestScore = 4,
                attempts = 1,
                errors = 1,
                completed = true,
            });
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        var module = await GetModuleAsync(client, "modulo-01");
        module.GetProperty("status").GetString().Should().Be("completed");
        module.GetProperty("requiredCompleted").GetInt32().Should().Be(5);
    }

    [Fact]
    public async Task ImportDeConvidadoNaoRegrideNotaExistente()
    {
        var client = await AuthenticatedClientAsync();

        await client.PutAsJsonAsync("/progress/activities/atividade-01", new
        {
            bestScore = 9,
            attempts = 1,
            errors = 0,
            completed = true,
        });

        var response = await client.PostAsJsonAsync("/progress/import", new
        {
            items = new[]
            {
                new { activitySlug = "atividade-01", bestScore = 2, attempts = 1, errors = 4, completed = true },
                new { activitySlug = "atividade-02", bestScore = 5, attempts = 1, errors = 0, completed = true },
            },
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var progress = await client.GetAsync("/progress");
        var body = await progress.ReadJsonAsync();
        var activities = body.RootElement.GetProperty("modules")[0].GetProperty("activities");

        var first = activities.EnumerateArray().First(a => a.GetProperty("slug").GetString() == "atividade-01");
        first.GetProperty("progress").GetProperty("bestScore").GetInt32().Should().Be(9);
    }

    [Fact]
    public async Task ImportIgnoraSlugInexistente()
    {
        var client = await AuthenticatedClientAsync();

        var response = await client.PostAsJsonAsync("/progress/import", new
        {
            items = new[]
            {
                new { activitySlug = "fantasma", bestScore = 5, attempts = 1, errors = 0, completed = true },
            },
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.ReadJsonAsync();
        body.RootElement.GetProperty("imported").GetInt32().Should().Be(0);
    }
}
