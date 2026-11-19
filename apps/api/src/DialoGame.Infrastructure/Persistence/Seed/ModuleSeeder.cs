using System.Text.Json;
using DialoGame.Domain.Entities;
using DialoGame.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DialoGame.Infrastructure.Persistence.Seed;

/// <summary>
/// Catálogo inicial. O seed é idempotente por slug: rodar duas vezes atualiza os
/// metadados e não duplica registros nem quebra o progresso já existente, que
/// referencia as atividades por id.
/// </summary>
public static class ModuleSeeder
{
    public static async Task SeedAsync(
        DialoGameDbContext db,
        ILogger? logger = null,
        CancellationToken ct = default)
    {
        var modules = CatalogData.Build();

        foreach (var module in modules)
        {
            var existing = await db.Modules
                .Include(m => m.Activities)
                .FirstOrDefaultAsync(m => m.Slug == module.Slug, ct);

            if (existing is null)
            {
                db.Modules.Add(module);
                continue;
            }

            existing.Title = module.Title;
            existing.Description = module.Description;
            existing.Concept = module.Concept;
            existing.Order = module.Order;

            foreach (var activity in module.Activities)
            {
                var current = existing.Activities.FirstOrDefault(a => a.Slug == activity.Slug);

                if (current is null)
                {
                    existing.Activities.Add(activity);
                    continue;
                }

                current.Title = activity.Title;
                current.Type = activity.Type;
                current.Order = activity.Order;
                current.IsRequired = activity.IsRequired;
                current.Config = activity.Config;
            }
        }

        var changed = await db.SaveChangesAsync(ct);

        if (changed > 0)
        {
            logger?.LogInformation("Catálogo sincronizado ({Changed} alterações).", changed);
        }
    }
}
