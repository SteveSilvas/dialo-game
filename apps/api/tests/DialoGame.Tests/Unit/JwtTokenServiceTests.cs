using System.IdentityModel.Tokens.Jwt;
using DialoGame.Domain.Entities;
using DialoGame.Infrastructure.Options;
using DialoGame.Infrastructure.Security;
using FluentAssertions;
using Microsoft.Extensions.Options;

namespace DialoGame.Tests.Unit;

public class JwtTokenServiceTests
{
    private static JwtTokenService BuildService(int accessMinutes = 15) => new(
        Options.Create(new JwtOptions
        {
            Issuer = "dialo-game",
            Audience = "dialo-game-web",
            SigningKey = "chave-de-teste-com-mais-de-32-caracteres!!",
            AccessTokenMinutes = accessMinutes,
            RefreshTokenDays = 7,
        }));

    [Fact]
    public void AccessTokenCarregaIdentidadeDoUsuario()
    {
        var user = new User { Username = "steve", Role = Domain.Enums.UserRole.Student };

        var token = BuildService().CreateAccessToken(user);
        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token.Value);

        parsed.Subject.Should().Be(user.Id.ToString());
        parsed.Claims.Should().Contain(c => c.Type == "username" && c.Value == "steve");
        parsed.Issuer.Should().Be("dialo-game");
        parsed.Audiences.Should().Contain("dialo-game-web");
    }

    [Fact]
    public void AccessTokenExpiraConformeConfigurado()
    {
        var user = new User { Username = "steve" };
        var before = DateTimeOffset.UtcNow;

        var token = BuildService(accessMinutes: 30).CreateAccessToken(user);

        token.ExpiresAt.Should().BeAfter(before.AddMinutes(29));
        token.ExpiresAt.Should().BeBefore(before.AddMinutes(31));
    }

    [Fact]
    public void RefreshTokenEHashNaoSeConfundem()
    {
        var service = BuildService();

        var (plain, hash) = service.CreateRefreshToken();

        plain.Should().NotBe(hash);
        hash.Should().Be(service.HashRefreshToken(plain));
        hash.Should().HaveLength(64);
    }

    [Fact]
    public void RefreshTokenSaoUnicos()
    {
        var service = BuildService();

        var tokens = Enumerable.Range(0, 50).Select(_ => service.CreateRefreshToken().Plain).ToList();

        tokens.Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public void HashDeRefreshTokenEDeterministico()
    {
        var service = BuildService();

        service.HashRefreshToken("abc").Should().Be(service.HashRefreshToken("abc"));
    }
}
