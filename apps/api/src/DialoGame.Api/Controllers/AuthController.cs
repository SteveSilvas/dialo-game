using System.Security.Claims;
using DialoGame.Api.Contracts;
using DialoGame.Api.Metrics;
using DialoGame.Domain.Entities;
using DialoGame.Infrastructure.Options;
using DialoGame.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace DialoGame.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    IAuthService authService,
    IOptions<AuthOptions> authOptions,
    DialoMetrics metrics) : ControllerBase
{
    private const string RefreshCookieName = "dialo_refresh";
    private readonly AuthOptions _auth = authOptions.Value;

    [HttpPost("register")]
    [EnableRateLimiting("register")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterBody body, CancellationToken ct)
    {
        var (outcome, user) = await authService.RegisterAsync(
            new RegisterRequest(body.Username, body.Email, body.Password),
            Request.Headers.UserAgent.ToString(),
            ct);

        if (!outcome.Succeeded)
        {
            return Failure(outcome.Failure);
        }

        SetRefreshCookie(outcome);
        return StatusCode(StatusCodes.Status201Created, BuildResponse(outcome, user!));
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginBody body, CancellationToken ct)
    {
        var (outcome, user) = await authService.LoginAsync(
            new LoginRequest(body.Identifier, body.Password, Request.Headers.UserAgent.ToString()),
            ct);

        metrics.RecordLogin("password", outcome.Succeeded);

        if (!outcome.Succeeded)
        {
            return Failure(outcome.Failure);
        }

        SetRefreshCookie(outcome);
        return Ok(BuildResponse(outcome, user!));
    }

    [HttpPost("google")]
    [EnableRateLimiting("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginBody body, CancellationToken ct)
    {
        var (outcome, user) = await authService.LoginWithGoogleAsync(
            new GoogleLoginRequest(body.IdToken, Request.Headers.UserAgent.ToString()),
            ct);

        metrics.RecordLogin("google", outcome.Succeeded);

        if (!outcome.Succeeded)
        {
            return Failure(outcome.Failure);
        }

        SetRefreshCookie(outcome);
        return Ok(BuildResponse(outcome, user!));
    }

    [HttpPost("refresh")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        var token = Request.Cookies[RefreshCookieName];
        var (outcome, user) = await authService.RefreshAsync(
            token,
            Request.Headers.UserAgent.ToString(),
            ct);

        if (!outcome.Succeeded)
        {
            ClearRefreshCookie();
            return Failure(outcome.Failure);
        }

        SetRefreshCookie(outcome);
        return Ok(BuildResponse(outcome, user!));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        await authService.RevokeAsync(Request.Cookies[RefreshCookieName], ct);
        ClearRefreshCookie();
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType<UserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(id, out var userId))
        {
            return Unauthorized();
        }

        var user = await authService.GetUserAsync(userId, ct);
        return user is null ? Unauthorized() : Ok(ToResponse(user));
    }

    private void SetRefreshCookie(AuthOutcome outcome) =>
        Response.Cookies.Append(
            RefreshCookieName,
            outcome.RefreshToken!,
            RefreshCookieOptions(outcome.RefreshTokenExpiresAt));

    private void ClearRefreshCookie() =>
        Response.Cookies.Delete(RefreshCookieName, RefreshCookieOptions());

    /// <summary>
    /// `SameSite=None` só é aceito pelo navegador junto com `Secure`; sem isso
    /// o cookie é descartado em silêncio e o refresh nunca funcionaria em
    /// desenvolvimento (http). Em produção o front e a API ficam em domínios
    /// diferentes, então é `None` mesmo — daí a chave ser a mesma.
    /// </summary>
    private CookieOptions RefreshCookieOptions(DateTimeOffset? expires = null) =>
        new()
        {
            HttpOnly = true,
            Secure = _auth.RefreshCookieSecure,
            SameSite = _auth.RefreshCookieSecure ? SameSiteMode.None : SameSiteMode.Lax,
            Path = _auth.RefreshCookiePath,
            Expires = expires,
            IsEssential = true,
        };

    private ObjectResult Failure(AuthFailure failure)
    {
        var (status, title, detail) = failure switch
        {
            AuthFailure.UsernameTaken => (
                StatusCodes.Status409Conflict,
                "Username indisponível",
                "Já existe uma conta com esse username."),
            AuthFailure.EmailTaken => (
                StatusCodes.Status409Conflict,
                "Email indisponível",
                "Já existe uma conta com esse email."),
            AuthFailure.WeakPassword => (
                StatusCodes.Status400BadRequest,
                "Senha fraca",
                PasswordPolicy.Describe()),
            AuthFailure.InvalidGoogleToken => (
                StatusCodes.Status401Unauthorized,
                "Token do Google inválido",
                "Não foi possível validar o token do Google."),
            AuthFailure.GoogleEmailNotVerified => (
                StatusCodes.Status401Unauthorized,
                "Email não verificado",
                "A conta do Google precisa ter o email verificado."),
            _ => (
                StatusCodes.Status401Unauthorized,
                "Credenciais inválidas",
                "Usuário ou senha incorretos."),
        };

        return Problem(statusCode: status, title: title, detail: detail);
    }

    private static AuthResponse BuildResponse(AuthOutcome outcome, User user) =>
        new(outcome.AccessToken!, outcome.AccessTokenExpiresAt, ToResponse(user));

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Username, user.Email, user.DisplayName, user.AvatarUrl,
            user.Role.ToString(), user.CreatedAt);
}
