namespace DialoGame.Infrastructure.Services;

/// <summary>
/// Regras de senha em um só lugar, para que cadastro e troca de senha não
/// divergam. A lista de senhas comuns cobre o que aparece em vazamentos e é
/// barato o suficiente para rodar a cada cadastro.
/// </summary>
public static class PasswordPolicy
{
    public const int MinimumLength = 8;
    public const int MaximumLength = 128;

    private static readonly HashSet<string> CommonPasswords = new(StringComparer.OrdinalIgnoreCase)
    {
        "12345678", "123456789", "1234567890", "senha123", "password", "password1",
        "qwertyui", "qwerty123", "abc12345", "11111111", "00000000", "iloveyou",
        "admin123", "letmein1", "welcome1", "monkey12", "dragon12", "football",
        "brasil123", "flamengo", "corinthians", "palmeiras", "aaaaaaaa", "asdfghjk",
    };

    public static bool IsValid(string? password) =>
        password is { Length: >= MinimumLength and <= MaximumLength } &&
        !CommonPasswords.Contains(password) &&
        !password.All(char.IsDigit) &&
        !password.All(c => c == password[0]);

    public static string Describe() =>
        $"A senha precisa ter entre {MinimumLength} e {MaximumLength} caracteres, " +
        "não pode ser só números ou um caractere repetido, nem estar entre as senhas mais comuns.";
}
