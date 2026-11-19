using DialoGame.Infrastructure.Security;
using FluentAssertions;

namespace DialoGame.Tests.Unit;

public class Argon2PasswordHasherTests
{
    private readonly Argon2PasswordHasher _hasher = new();

    [Fact]
    public void VerificaSenhaCorreta()
    {
        var hash = _hasher.Hash("SenhaForte123");

        _hasher.Verify("SenhaForte123", hash).Should().BeTrue();
    }

    [Fact]
    public void RejeitaSenhaErrada()
    {
        var hash = _hasher.Hash("SenhaForte123");

        _hasher.Verify("SenhaForte124", hash).Should().BeFalse();
    }

    [Fact]
    public void HashNuncaContemASenhaEmClaro()
    {
        var hash = _hasher.Hash("SenhaForte123");

        hash.Should().NotContain("SenhaForte123");
        hash.Should().StartWith("argon2id$");
    }

    [Fact]
    public void MesmaSenhaGeraHashesDiferentes()
    {
        // Salt aleatório: dois cadastros com a mesma senha não podem coincidir,
        // senão o hash vira um identificador da senha.
        _hasher.Hash("SenhaForte123").Should().NotBe(_hasher.Hash("SenhaForte123"));
    }

    [Theory]
    [InlineData("")]
    [InlineData("nao-e-um-hash")]
    [InlineData("argon2id$1$2$3")]
    [InlineData("bcrypt$abc$def$ghi$jkl$mno")]
    public void RejeitaHashMalformado(string hash)
    {
        _hasher.Verify("SenhaForte123", hash).Should().BeFalse();
    }
}
