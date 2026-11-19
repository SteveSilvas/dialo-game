using System.Security.Claims;
using DialoGame.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace DialoGame.Api.Controllers;

[ApiController]
[Route("catalog")]
public class CatalogController(ICatalogService catalogService) : ControllerBase
{
    /// <summary>
    /// Catálogo completo com o estado de desbloqueio. Autenticado devolve o
    /// progresso do usuário; anônimo devolve a trilha sem progresso, o que
    /// permite o modo convidado sem uma segunda rota.
    /// </summary>
    [HttpGet]
    [ProducesResponseType<CatalogSnapshot>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var parsed = Guid.TryParse(userId, out var id) ? id : (Guid?)null;

        return Ok(await catalogService.GetCatalogAsync(parsed, ct));
    }
}
