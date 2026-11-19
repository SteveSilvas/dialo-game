using DialoGame.Infrastructure.Options;
using Google.Apis.Auth;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DialoGame.Infrastructure.Security;

public class GoogleTokenValidator(
    IOptions<GoogleOptions> options,
    ILogger<GoogleTokenValidator> logger) : IGoogleTokenValidator
{
    private readonly GoogleOptions _options = options.Value;

    public async Task<GooglePayload?> ValidateAsync(string idToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(idToken) || string.IsNullOrWhiteSpace(_options.ClientId))
        {
            return null;
        }

        try
        {
            // ValidateAsync confere assinatura, issuer, expiração e audience.
            // Nunca ler o payload no cliente e mandar os campos: o front é hostil.
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_options.ClientId],
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            if (payload is null)
            {
                return null;
            }

            return new GooglePayload(
                payload.Subject,
                payload.Email,
                payload.EmailVerified,
                payload.Name,
                payload.Picture);
        }
        catch (InvalidJwtException ex)
        {
            logger.LogWarning("Token do Google rejeitado: {Reason}", ex.Message);
            return null;
        }
    }
}
