using DialoGame.Domain.Entities;
using DialoGame.Domain.Enums;

namespace DialoGame.Infrastructure.Services;

/// <summary>
/// Regra de progressão da trilha. Fica no servidor de propósito: se vivesse no
/// cliente, bastaria editar o armazenamento local para pular módulos.
/// </summary>
public static class ModuleUnlockService
{
    /// <summary>
    /// Módulo N só abre quando todos os anteriores estão concluídos. O primeiro
    /// módulo está sempre liberado, para a criança nunca encarar uma tela vazia.
    /// </summary>
    public static IReadOnlyDictionary<Guid, ModuleStatus> Evaluate(
        IReadOnlyList<Module> orderedModules,
        IReadOnlyCollection<ActivityProgress> progress)
    {
        var completedActivityIds = progress
            .Where(p => p.CompletedAt is not null)
            .Select(p => p.ActivityId)
            .ToHashSet();

        var result = new Dictionary<Guid, ModuleStatus>(orderedModules.Count);
        var previousCompleted = true;
        var currentAssigned = false;

        foreach (var module in orderedModules.OrderBy(m => m.Order))
        {
            var required = module.Activities.Where(a => a.IsRequired).ToList();
            var isCompleted = required.Count > 0 &&
                              required.All(a => completedActivityIds.Contains(a.Id));

            if (isCompleted)
            {
                result[module.Id] = ModuleStatus.Completed;
                previousCompleted = true;
                continue;
            }

            if (previousCompleted && !currentAssigned)
            {
                result[module.Id] = ModuleStatus.Current;
                currentAssigned = true;
                previousCompleted = false;
                continue;
            }

            result[module.Id] = ModuleStatus.Locked;
            previousCompleted = false;
        }

        return result;
    }

    /// <summary>
    /// Um módulo aceita registro de progresso quando está liberado. Módulo
    /// concluído continua liberado, para permitir repetir e melhorar a nota.
    /// </summary>
    public static bool IsUnlocked(ModuleStatus status) =>
        status is ModuleStatus.Current or ModuleStatus.Completed;

    public static bool IsModuleCompleted(
        Module module,
        IReadOnlyCollection<ActivityProgress> progress)
    {
        var completedActivityIds = progress
            .Where(p => p.CompletedAt is not null)
            .Select(p => p.ActivityId)
            .ToHashSet();

        var required = module.Activities.Where(a => a.IsRequired).ToList();
        return required.Count > 0 && required.All(a => completedActivityIds.Contains(a.Id));
    }
}
