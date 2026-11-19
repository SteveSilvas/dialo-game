using DialoGame.Infrastructure.Services;
using FluentAssertions;

namespace DialoGame.Tests.Unit;

public class PasswordPolicyTests
{
    [Theory]
    [InlineData("SenhaForte123")]
    [InlineData("minha senha longa")]
    [InlineData("a1b2c3d4")]
    public void AceitaSenhasFortes(string senha)
    {
        PasswordPolicy.IsValid(senha).Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("curta1")]
    [InlineData("12345678")]
    [InlineData("11111111")]
    [InlineData("password")]
    [InlineData("senha123")]
    public void RejeitaSenhasFracas(string? senha)
    {
        PasswordPolicy.IsValid(senha).Should().BeFalse();
    }

    [Fact]
    public void RejeitaSenhaAcimaDoLimite()
    {
        PasswordPolicy.IsValid(new string('a', 200)).Should().BeFalse();
    }
}
