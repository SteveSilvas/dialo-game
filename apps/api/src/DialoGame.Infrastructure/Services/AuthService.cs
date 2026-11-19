using DialoGame.Domain.Entities;
using DialoGame.Infrastructure.Options;
using DialoGame.Infrastructure.Persistence;
using DialoGame.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DialoGame.Infrastructure.Services;

public class AuthService(
    DialoGameDbContext db,
    IPasswordHasher passwordHasher,
    ITokenService tokenService,
    IGoogleTokenValidator googleValidator,
    IOptions<JwtOptions> jwtOptions,
    ILogger<AuthService> logger) : IAuthService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public async Task<(AuthOutcome Outcome, User? User)> RegisterAsync(
        RegisterRequest request,
        string? userAgent,
        CancellationToken ct = default)
    {
        var username = request.Username?.Trim().ToLowerInvariant() ?? string.Empty;
        var email = string.IsNullOrWhiteSpace(request.Email)
            ? null
            : request.Email.Trim().ToLowerInvariant();

        if (!PasswordPolicy.IsValid(request.Password))
        {
            return (AuthOutcome.Fail(AuthFailure.WeakPassword), null);
        }

        if (await db.Users.AnyAsync(u => u.Username == username, ct))
        {
            return (AuthOutcome.Fail(AuthFailure.UsernameTaken), null);
        }

        if (email is not null && await db.Users.AnyAsync(u => u.Email == email, ct))
        {
            return (AuthOutcome.Fail(AuthFailure.EmailTaken), null);
        }

        var user = new User
        {
            Username = username,
            Email = email,
            PasswordHash = passwordHasher.Hash(request.Password),
            DisplayName = request.Username?.Trim(),
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        logger.LogInformation("Usuário {UserId} cadastrado.", user.Id);

        return (await IssueTokensAsync(user, userAgent, familyId: null, ct), user);
    }

    public async Task<(AuthOutcome Outcome, User? User)> LoginAsync(
        LoginRequest request,
        CancellationToken ct = default)
    {
        var identifier = request.Identifier?.Trim().ToLowerInvariant() ?? string.Empty;

        var user = await db.Users.FirstOrDefaultAsync(
            u => u.Username == identifier || (u.Email != null && u.Email == identifier), ct);

        // Verificar o hash mesmo quando o usuário não existe mantém o tempo de
        // resposta parecido; senão a diferença de latência revela quem está cadastrado.
        var hash = user?.PasswordHash;
        var passwordOk = hash is not null && passwordHasher.Verify(request.Password, hash);

        if (user is null || !passwordOk)
        {
            if (user is not null && user.PasswordHash is null)
            {
                logger.LogInformation(
                    "Tentativa de login por senha em conta só Google: {UserId}.", user.Id);
            }

            return (AuthOutcome.Fail(AuthFailure.InvalidCredentials), null);
        }

        return (await IssueTokensAsync(user, request.UserAgent, familyId: null, ct), user);
    }

    public async Task<(AuthOutcome Outcome, User? User)> LoginWithGoogleAsync(
        GoogleLoginRequest request,
        CancellationToken ct = default)
    {
        var payload = await googleValidator.ValidateAsync(request.IdToken, ct);
        if (payload is null)
        {
            return (AuthOutcome.Fail(AuthFailure.InvalidGoogleToken), null);
        }

        if (!payload.EmailVerified)
        {
            return (AuthOutcome.Fail(AuthFailure.GoogleEmailNotVerified), null);
        }

        var email = payload.Email.ToLowerInvariant();

        var user = await db.Users.FirstOrDefaultAsync(
            u => u.GoogleId == payload.Subject || u.Email == email, ct);

        if (user is null)
        {
            user = new User
            {
                Username = await BuildUniqueUsernameAsync(email, ct),
                Email = email,
                GoogleId = payload.Subject,
                DisplayName = payload.Name,
                AvatarUrl = payload.Picture,
                PasswordHash = null,
            };

            db.Users.Add(user);
        }
        else if (user.GoogleId is null)
        {
            // Conta criada com senha e agora entrando com Google: vincula as duas
            // formas em vez de criar uma conta paralela com o mesmo email.
            user.GoogleId = payload.Subject;
            user.AvatarUrl ??= payload.Picture;
            user.DisplayName ??= payload.Name;
        }

        await db.SaveChangesAsync(ct);

        return (await IssueTokensAsync(user, request.UserAgent, familyId: null, ct), user);
    }

    public async Task<(AuthOutcome Outcome, User? User)> RefreshAsync(
        string? refreshToken,
        string? userAgent,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return (AuthOutcome.Fail(AuthFailure.InvalidRefreshToken), null);
        }

        var hash = tokenService.HashRefreshToken(refreshToken);

        var stored = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored is null)
        {
            return (AuthOutcome.Fail(AuthFailure.InvalidRefreshToken), null);
        }

        if (stored.RevokedAt is not null)
        {
            // Token já usado: ou é reuso por roubo, ou o cliente repetiu a chamada.
            // Nos dois casos a família inteira é revogada, porque não dá para
            // distinguir os cenários — e o custo de errar para o lado seguro é
            // apenas um novo login.
            logger.LogWarning(
                "Reuso de refresh token revogado. Família {FamilyId} revogada por segurança.",
                stored.FamilyId);

            await RevokeFamilyAsync(stored.FamilyId, ct);
            return (AuthOutcome.Fail(AuthFailure.InvalidRefreshToken), null);
        }

        if (stored.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return (AuthOutcome.Fail(AuthFailure.InvalidRefreshToken), null);
        }

        if (stored.User is null)
        {
            return (AuthOutcome.Fail(AuthFailure.InvalidRefreshToken), null);
        }

        stored.RevokedAt = DateTimeOffset.UtcNow;

        return (await IssueTokensAsync(stored.User, userAgent, stored.FamilyId, ct), stored.User);
    }

    public async Task RevokeAsync(string? refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var hash = tokenService.HashRefreshToken(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored is null || stored.RevokedAt is not null)
        {
            return;
        }

        stored.RevokedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public Task<User?> GetUserAsync(Guid userId, CancellationToken ct = default) =>
        db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);

    private async Task RevokeFamilyAsync(Guid familyId, CancellationToken ct)
    {
        var family = await db.RefreshTokens
            .Where(t => t.FamilyId == familyId && t.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var token in family)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task<AuthOutcome> IssueTokensAsync(
        User user,
        string? userAgent,
        Guid? familyId,
        CancellationToken ct)
    {
        var access = tokenService.CreateAccessToken(user);
        var (plain, hash) = tokenService.CreateRefreshToken();
        var refreshExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwt.RefreshTokenDays);

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = hash,
            FamilyId = familyId ?? Guid.NewGuid(),
            ExpiresAt = refreshExpiresAt,
            UserAgent = Truncate(userAgent, 256),
        });

        await db.SaveChangesAsync(ct);

        return new AuthOutcome(
            true,
            AuthFailure.None,
            access.Value,
            access.ExpiresAt,
            plain,
            refreshExpiresAt);
    }

    private async Task<string> BuildUniqueUsernameAsync(string email, CancellationToken ct)
    {
        var localPart = email.Split('@')[0];
        var sanitized = new string(localPart
            .Where(c => char.IsAsciiLetterOrDigit(c) || c == '_')
            .ToArray())
            .ToLowerInvariant();

        if (sanitized.Length < 3)
        {
            sanitized = $"aluno{sanitized}";
        }

        if (sanitized.Length > 16)
        {
            sanitized = sanitized[..16];
        }

        var candidate = sanitized;
        var suffix = 1;

        while (await db.Users.AnyAsync(u => u.Username == candidate, ct))
        {
            var suffixText = suffix.ToString(System.Globalization.CultureInfo.InvariantCulture);
            candidate = sanitized[..Math.Min(sanitized.Length, 20 - suffixText.Length)] + suffixText;
            suffix++;
        }

        return candidate;
    }

    private static string? Truncate(string? value, int max) =>
        value is null || value.Length <= max ? value : value[..max];
}
