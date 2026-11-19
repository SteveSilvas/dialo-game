using System.Security.Claims;
using DialoGame.Api.Contracts;
using DialoGame.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DialoGame.Api.Controllers;

[ApiController]
[Route("progress")]
[Authorize]
public class ProgressController(IProgressService progressService) : ControllerBase
{
    [HttpPut("activities/{slug}")]
    [ProducesResponseType<ActivityProgressSnapshot>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Record(
        string slug,
        [FromBody] ActivityProgressBody body,
        CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var outcome = await progressService.RecordAsync(
            userId,
            slug,
            new ProgressUpdateRequest(body.BestScore, body.Attempts, body.Errors, body.Completed),
            ct);

        return outcome.Failure switch
        {
            ProgressFailure.ActivityNotFound => Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Atividade não encontrada",
                detail: $"Nenhuma atividade com o slug '{slug}'."),
            ProgressFailure.ModuleLocked => Problem(
                statusCode: StatusCodes.Status403Forbidden,
                title: "Módulo bloqueado",
                detail: $"O módulo '{outcome.ModuleSlug}' ainda não foi liberado."),
            _ => Ok(outcome.Progress),
        };
    }

    [HttpGet]
    [ProducesResponseType<CatalogSnapshot>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        return Ok(await progressService.GetProgressAsync(userId, ct));
    }

    /// <summary>
    /// Envia para a conta o progresso feito como convidado. A importação só
    /// melhora o que já existe, nunca regride uma nota.
    /// </summary>
    [HttpPost("import")]
    [ProducesResponseType<ImportProgressResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Import(
        [FromBody] ImportProgressBody body,
        CancellationToken ct)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var items = body.Items
            .Select(i => new ImportedActivityProgress(
                i.ActivitySlug, i.BestScore, i.Attempts, i.Errors, i.Completed))
            .ToList();

        var imported = await progressService.ImportAsync(userId, items, ct);
        return Ok(new ImportProgressResponse(imported));
    }

    private bool TryGetUserId(out Guid userId) =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}
