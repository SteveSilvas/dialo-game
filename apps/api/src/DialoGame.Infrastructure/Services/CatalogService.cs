using DialoGame.Domain.Entities;
using DialoGame.Domain.Enums;
using DialoGame.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DialoGame.Infrastructure.Services;

public record ActivityProgressSnapshot(
    string ActivitySlug,
    int BestScore,
    int Attempts,
    int Errors,
    int Stars,
    DateTimeOffset? CompletedAt);

public record ActivitySnapshot(
    string Slug,
    string Title,
    ActivityType Type,
    int Order,
    bool IsRequired,
    string ConfigJson,
    ActivityProgressSnapshot? Progress);

public record ModuleSnapshot(
    string Slug,
    string Title,
    string Description,
    string Concept,
    int Order,
    ModuleStatus Status,
    bool IsUnlocked,
    int RequiredTotal,
    int RequiredCompleted,
    int Stars,
    int MaxStars,
    IReadOnlyList<ActivitySnapshot> Activities);

public record CatalogSnapshot(IReadOnlyList<ModuleSnapshot> Modules);

public enum ProgressFailure
{
    None = 0,
    ActivityNotFound = 1,
    ModuleLocked = 2,
}

public record ProgressUpdateRequest(int BestScore, int Attempts, int Errors, bool Completed);

public record ProgressUpdateOutcome(
    ProgressFailure Failure,
    ActivityProgressSnapshot? Progress,
    string? ModuleSlug);

public interface ICatalogService
{
    Task<CatalogSnapshot> GetCatalogAsync(Guid? userId, CancellationToken ct = default);
}

public interface IProgressService
{
    Task<ProgressUpdateOutcome> RecordAsync(
        Guid userId,
        string activitySlug,
        ProgressUpdateRequest request,
        CancellationToken ct = default);

    Task<CatalogSnapshot> GetProgressAsync(Guid userId, CancellationToken ct = default);

    Task<int> ImportAsync(
        Guid userId,
        IReadOnlyList<ImportedActivityProgress> items,
        CancellationToken ct = default);
}

public record ImportedActivityProgress(
    string ActivitySlug,
    int BestScore,
    int Attempts,
    int Errors,
    bool Completed);

public class CatalogService(DialoGameDbContext db) : ICatalogService, IProgressService
{
    public async Task<CatalogSnapshot> GetCatalogAsync(Guid? userId, CancellationToken ct = default)
    {
        var modules = await LoadModulesAsync(ct);
        var progress = userId is null
            ? []
            : await db.ActivityProgress
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .ToListAsync(ct);

        return BuildSnapshot(modules, progress);
    }

    public Task<CatalogSnapshot> GetProgressAsync(Guid userId, CancellationToken ct = default) =>
        GetCatalogAsync(userId, ct);

    public async Task<ProgressUpdateOutcome> RecordAsync(
        Guid userId,
        string activitySlug,
        ProgressUpdateRequest request,
        CancellationToken ct = default)
    {
        var modules = await LoadModulesAsync(ct);
        var activity = modules
            .SelectMany(m => m.Activities)
            .FirstOrDefault(a => a.Slug == activitySlug);

        if (activity is null)
        {
            return new ProgressUpdateOutcome(ProgressFailure.ActivityNotFound, null, null);
        }

        var userProgress = await db.ActivityProgress
            .Where(p => p.UserId == userId)
            .ToListAsync(ct);

        var statuses = ModuleUnlockService.Evaluate(modules, userProgress);
        var module = modules.First(m => m.Id == activity.ModuleId);

        if (!ModuleUnlockService.IsUnlocked(statuses[module.Id]))
        {
            return new ProgressUpdateOutcome(ProgressFailure.ModuleLocked, null, module.Slug);
        }

        var existing = userProgress.FirstOrDefault(p => p.ActivityId == activity.Id);
        var now = DateTimeOffset.UtcNow;

        var attempts = (existing?.Attempts ?? 0) + Math.Max(request.Attempts, 0);

        var (bestScore, errors) = ScoreCalculator.MergeBestAttempt(
            existing?.BestScore ?? 0,
            existing?.Errors ?? 0,
            request.BestScore,
            request.Errors);

        var stars = Math.Max(
            ScoreCalculator.CalculateStars(bestScore, errors),
            existing?.Stars ?? 0);

        var completedAt = existing?.CompletedAt;
        if (request.Completed && completedAt is null)
        {
            completedAt = now;
        }

        if (existing is null)
        {
            existing = new ActivityProgress
            {
                UserId = userId,
                ActivityId = activity.Id,
            };
            db.ActivityProgress.Add(existing);
        }

        existing.BestScore = bestScore;
        existing.Attempts = attempts;
        existing.Errors = errors;
        existing.Stars = stars;
        existing.CompletedAt = completedAt;
        existing.UpdatedAt = now;

        await db.SaveChangesAsync(ct);

        return new ProgressUpdateOutcome(
            ProgressFailure.None,
            new ActivityProgressSnapshot(
                activity.Slug,
                existing.BestScore,
                existing.Attempts,
                existing.Errors,
                existing.Stars,
                existing.CompletedAt),
            module.Slug);
    }

    public async Task<int> ImportAsync(
        Guid userId,
        IReadOnlyList<ImportedActivityProgress> items,
        CancellationToken ct = default)
    {
        if (items.Count == 0)
        {
            return 0;
        }

        var modules = await LoadModulesAsync(ct);
        var bySlug = modules
            .SelectMany(m => m.Activities)
            .ToDictionary(a => a.Slug, StringComparer.OrdinalIgnoreCase);

        var existing = await db.ActivityProgress
            .Where(p => p.UserId == userId)
            .ToListAsync(ct);

        var imported = 0;
        var now = DateTimeOffset.UtcNow;

        foreach (var item in items)
        {
            if (!bySlug.TryGetValue(item.ActivitySlug, out var activity))
            {
                continue;
            }

            var record = existing.FirstOrDefault(p => p.ActivityId == activity.Id);

            if (record is null)
            {
                record = new ActivityProgress
                {
                    UserId = userId,
                    ActivityId = activity.Id,
                };
                db.ActivityProgress.Add(record);
                existing.Add(record);
            }

            // Importar do convidado nunca piora o que já está no servidor.
            var (bestScore, errors) = ScoreCalculator.MergeBestAttempt(
                record.BestScore,
                record.Errors,
                item.BestScore,
                item.Errors);

            record.BestScore = bestScore;
            record.Errors = errors;
            record.Attempts += Math.Max(item.Attempts, 0);
            record.Stars = Math.Max(
                record.Stars,
                ScoreCalculator.CalculateStars(record.BestScore, record.Errors));
            record.CompletedAt ??= item.Completed ? now : null;
            record.UpdatedAt = now;
            imported++;
        }

        await db.SaveChangesAsync(ct);
        return imported;
    }

    private async Task<List<Module>> LoadModulesAsync(CancellationToken ct) =>
        await db.Modules
            .AsNoTracking()
            .Include(m => m.Activities)
            .OrderBy(m => m.Order)
            .ToListAsync(ct);

    private static CatalogSnapshot BuildSnapshot(
        List<Module> modules,
        List<ActivityProgress> progress)
    {
        var statuses = ModuleUnlockService.Evaluate(modules, progress);
        var progressByActivity = progress.ToDictionary(p => p.ActivityId);

        var snapshots = modules
            .OrderBy(m => m.Order)
            .Select(module =>
            {
                var status = statuses[module.Id];
                var activities = module.Activities
                    .OrderBy(a => a.Order)
                    .Select(a =>
                    {
                        progressByActivity.TryGetValue(a.Id, out var p);
                        return new ActivitySnapshot(
                            a.Slug,
                            a.Title,
                            a.Type,
                            a.Order,
                            a.IsRequired,
                            a.Config.RootElement.GetRawText(),
                            p is null
                                ? null
                                : new ActivityProgressSnapshot(
                                    a.Slug,
                                    p.BestScore,
                                    p.Attempts,
                                    p.Errors,
                                    p.Stars,
                                    p.CompletedAt));
                    })
                    .ToList();

                var required = activities.Where(a => a.IsRequired).ToList();
                var completed = required.Count(a => a.Progress?.CompletedAt is not null);

                return new ModuleSnapshot(
                    module.Slug,
                    module.Title,
                    module.Description,
                    module.Concept,
                    module.Order,
                    status,
                    ModuleUnlockService.IsUnlocked(status),
                    required.Count,
                    completed,
                    activities.Sum(a => a.Progress?.Stars ?? 0),
                    activities.Count * ScoreCalculator.MaxStars,
                    activities);
            })
            .ToList();

        return new CatalogSnapshot(snapshots);
    }
}
