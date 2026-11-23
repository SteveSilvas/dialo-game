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
        modules.Should().HaveCount(4);
        modules.Select(m => m.Slug).Should()
            .BeEquivalentTo("modulo-01", "modulo-02", "modulo-03", "modulo-04");
        modules.Single(m => m.Slug == "modulo-01").Activities.Should().HaveCount(5);
        modules.SelectMany(m => m.Activities).Select(a => a.Slug).Should().OnlyHaveUniqueItems();
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
    public async Task Modulo01ConcluidoDesbloqueiaOModulo02EMantemOModulo03Bloqueado()
    {
        var client = await AuthenticatedClientAsync();

        var before = await client.GetAsync("/catalog");
        var beforeBody = await before.ReadJsonAsync();
        var initialModules = beforeBody.RootElement.GetProperty("modules").EnumerateArray().ToList();
        initialModules.Single(m => m.GetProperty("slug").GetString() == "modulo-01")
            .GetProperty("status").GetString().Should().Be("current");
        initialModules.Single(m => m.GetProperty("slug").GetString() == "modulo-02")
            .GetProperty("status").GetString().Should().Be("locked");
        initialModules.Single(m => m.GetProperty("slug").GetString() == "modulo-03")
            .GetProperty("status").GetString().Should().Be("locked");

        foreach (var slug in new[] { "atividade-01", "atividade-02", "atividade-03", "atividade-04", "atividade-05" })
        {
            var put = await client.PutAsJsonAsync($"/progress/activities/{slug}", new
            {
                bestScore = 4,
                attempts = 1,
                errors = 0,
                completed = true,
            });
            put.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        // Só o módulo 02 abre: a trilha é sequencial, e o 03 depende do 02.
        (await GetModuleAsync(client, "modulo-01"))
            .GetProperty("status").GetString().Should().Be("completed");
        (await GetModuleAsync(client, "modulo-02"))
            .GetProperty("status").GetString().Should().Be("current");
        (await GetModuleAsync(client, "modulo-03"))
            .GetProperty("status").GetString().Should().Be("locked");
    }

    [Fact]
    public async Task ProgressoEmModuloBloqueadoERecusado()
    {
        var client = await AuthenticatedClientAsync();

        var response = await client.PutAsJsonAsync("/progress/activities/modulo-02-atividade-01", new
        {
            bestScore = 1,
            attempts = 1,
            errors = 0,
            completed = true,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
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
    [Fact]
    public void ConfigDeCompleteWordApontaParaUmaPalavraPossivel()
    {
        var modules = DialoGame.Infrastructure.Persistence.Seed.CatalogData.Build();
        var activities = modules
            .SelectMany(m => m.Activities.Select(a => (Module: m, Activity: a)))
            .Where(x => x.Activity.Type == DialoGame.Domain.Enums.ActivityType.CompleteWord)
            .ToList();

        activities.Should().NotBeEmpty("o módulo 04 depende deste tipo de atividade");

        foreach (var (module, activity) in activities)
        {
            var config = activity.Config.RootElement;
            var word = config.GetProperty("word").GetString()!;
            var syllables = config.GetProperty("syllables").EnumerateArray()
                .Select(s => s.GetString()!).ToList();
            var missingIndex = config.GetProperty("missingIndex").GetInt32();
            var answer = config.GetProperty("answer").GetString()!;
            var options = config.GetProperty("options").EnumerateArray()
                .Select(o => o.GetString()!).ToList();

            // As sílabas precisam remontar a palavra: é o que a tela desenha.
            string.Concat(syllables).Should().Be(word,
                $"{activity.Slug}: sílabas não formam a palavra");

            missingIndex.Should().BeInRange(0, syllables.Count - 1,
                $"{activity.Slug}: posição escondida fora do intervalo");

            // A resposta é a sílaba da posição escondida; sem isso a opção
            // "certa" não fecha o buraco que a criança vê.
            syllables[missingIndex].Should().Be(answer,
                $"{activity.Slug}: resposta diferente da sílaba que falta");

            options.Should().Contain(answer,
                $"{activity.Slug}: a resposta precisa estar entre as opções");
            options.Should().OnlyHaveUniqueItems(
                $"{activity.Slug}: opções repetidas não distinguem nada");
            options.Should().HaveCountGreaterThan(1,
                $"{activity.Slug}: uma opção só não é escolha");
        }
    }

    [Fact]
    public void PalavrasDoModulo04NaoSeRepetemNosModulosAnteriores()
    {
        var modules = DialoGame.Infrastructure.Persistence.Seed.CatalogData.Build();

        static IEnumerable<string> WordsOf(DialoGame.Domain.Entities.Module module) =>
            module.Activities
                .Select(a => a.Config.RootElement)
                .Where(c => c.TryGetProperty("word", out _))
                .Select(c => c.GetProperty("word").GetString()!)
                .Select(w => w.ToUpperInvariant());

        var previous = modules
            .Where(m => m.Order < 4)
            .SelectMany(WordsOf)
            .ToHashSet();

        var current = modules
            .Where(m => m.Order == 4)
            .SelectMany(WordsOf)
            .ToList();

        current.Should().NotBeEmpty();
        current.Should().OnlyHaveUniqueItems("repetir a palavra no mesmo módulo entrega a resposta");
        current.Should().NotIntersectWith(previous,
            "repetir a palavra de um módulo anterior faz a criança decorar em vez de ler");
    }

    [Fact]
    public void DistratoresDoModulo04DiferemSoNaVogal()
    {
        var activities = DialoGame.Infrastructure.Persistence.Seed.CatalogData.Build()
            .Where(m => m.Order == 4)
            .SelectMany(m => m.Activities)
            .Where(a => a.Type == DialoGame.Domain.Enums.ActivityType.CompleteWord)
            .ToList();

        activities.Should().NotBeEmpty();

        foreach (var activity in activities)
        {
            var config = activity.Config.RootElement;
            var answer = config.GetProperty("answer").GetString()!;
            var options = config.GetProperty("options").EnumerateArray()
                .Select(o => o.GetString()!)
                .ToList();

            var consonants = options
                .Select(o => o.TrimEnd('A', 'E', 'I', 'O', 'U'))
                .Distinct()
                .ToList();

            // A discriminação fina é o que separa este módulo do "qual sílaba
            // combina": se o distrator muda a consoante, a criança acerta pelo
            // desenho da sílaba sem ouvir diferença nenhuma.
            consonants.Should().HaveCount(1,
                $"{activity.Slug}: os distratores de '{answer}' devem diferir só na vogal");
        }
    }

    [Fact]
    public void Modulo04NaoRepeteAMesmaPosicaoNaMesmaExtensao()
    {
        var shapes = DialoGame.Infrastructure.Persistence.Seed.CatalogData.Build()
            .Where(m => m.Order == 4)
            .SelectMany(m => m.Activities)
            .Where(a => a.Type == DialoGame.Domain.Enums.ActivityType.CompleteWord)
            .Select(a =>
            {
                var config = a.Config.RootElement;
                var syllables = config.GetProperty("syllables").GetArrayLength();
                var missing = config.GetProperty("missingIndex").GetInt32();
                return (a.Slug, Shape: (syllables, missing));
            })
            .ToList();

        shapes.Should().NotBeEmpty();

        // Duas atividades com a mesma extensão e a mesma posição escondida são a
        // mesma tarefa com outra palavra: a criança não avança, só troca o item.
        shapes.Select(s => s.Shape).Should().OnlyHaveUniqueItems(
            "cada atividade do módulo 04 precisa mudar a posição escondida ou a extensão da palavra");
    }
}
