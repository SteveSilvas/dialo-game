namespace DialoGame.Infrastructure.Services;

public enum AuthFailure
{
    None = 0,
    InvalidCredentials = 1,
    UsernameTaken = 2,
    EmailTaken = 3,
    WeakPassword = 4,
    InvalidRefreshToken = 5,
    InvalidGoogleToken = 6,
    GoogleEmailNotVerified = 7,
}

public record AuthOutcome(
    bool Succeeded,
    AuthFailure Failure,
    string? AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string? RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt)
{
    public static AuthOutcome Fail(AuthFailure failure) =>
        new(false, failure, null, default, null, default);
}
