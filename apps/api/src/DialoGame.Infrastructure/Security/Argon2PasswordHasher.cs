using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace DialoGame.Infrastructure.Security;

/// <summary>
/// Argon2id com parâmetros acima do mínimo da OWASP (19 MiB, t=2, p=1).
/// O hash serializado carrega salt e parâmetros, para permitir aumentar o custo
/// depois sem invalidar as senhas já cadastradas.
/// </summary>
public class Argon2PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int MemoryKb = 19 * 1024;
    private const int Iterations = 2;
    private const int Parallelism = 1;
    private const string Prefix = "argon2id";

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrEmpty(password);

        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Derive(password, salt, MemoryKb, Iterations, Parallelism);

        return string.Join('$',
            Prefix,
            MemoryKb.ToString(CultureInfo.InvariantCulture),
            Iterations.ToString(CultureInfo.InvariantCulture),
            Parallelism.ToString(CultureInfo.InvariantCulture),
            Convert.ToBase64String(salt),
            Convert.ToBase64String(hash));
    }

    public bool Verify(string password, string hash)
    {
        if (string.IsNullOrEmpty(password) || string.IsNullOrEmpty(hash))
        {
            return false;
        }

        var parts = hash.Split('$');
        if (parts.Length != 6 || parts[0] != Prefix)
        {
            return false;
        }

        if (!int.TryParse(parts[1], CultureInfo.InvariantCulture, out var memoryKb) ||
            !int.TryParse(parts[2], CultureInfo.InvariantCulture, out var iterations) ||
            !int.TryParse(parts[3], CultureInfo.InvariantCulture, out var parallelism))
        {
            return false;
        }

        byte[] salt;
        byte[] expected;
        try
        {
            salt = Convert.FromBase64String(parts[4]);
            expected = Convert.FromBase64String(parts[5]);
        }
        catch (FormatException)
        {
            return false;
        }

        var actual = Derive(password, salt, memoryKb, iterations, parallelism);

        // Comparação em tempo constante: um == vazaria o prefixo correto por timing.
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }

    private static byte[] Derive(string password, byte[] salt, int memoryKb, int iterations, int parallelism)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            MemorySize = memoryKb,
            Iterations = iterations,
            DegreeOfParallelism = parallelism,
        };

        return argon2.GetBytes(HashSize);
    }
}
