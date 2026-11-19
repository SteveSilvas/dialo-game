using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using FluentAssertions;

namespace DialoGame.Tests.Integration;

/// <summary>
/// Usa uma factory própria porque precisa de rate limit ativo — a
/// <see cref="ApiFactory"/> desliga o limite para os demais testes.
/// </summary>
public class RateLimitingTests : IClassFixture<RateLimitingTests.LimitedFactory>
{
    public class LimitedFactory : ApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseSetting("RateLimiting:Enabled", "true");
            builder.UseSetting("RateLimiting:LoginPermitLimit", "3");
            builder.UseSetting("RateLimiting:LoginWindowMinutes", "15");
        }
    }

    private readonly LimitedFactory _factory;

    public RateLimitingTests(LimitedFactory factory) => _factory = factory;

    [Fact]
    public async Task LoginBloqueiaAposExcederLimite()
    {
        var client = _factory.CreateClient();

        var statuses = new List<HttpStatusCode>();
        for (var i = 0; i < 6; i++)
        {
            var response = await client.PostAsJsonAsync("/auth/login", new
            {
                identifier = "ninguem",
                password = "SenhaForte123",
            });
            statuses.Add(response.StatusCode);
        }

        statuses.Take(3).Should().OnlyContain(s => s == HttpStatusCode.Unauthorized);
        statuses.Skip(3).Should().OnlyContain(s => s == HttpStatusCode.TooManyRequests);
    }
}
