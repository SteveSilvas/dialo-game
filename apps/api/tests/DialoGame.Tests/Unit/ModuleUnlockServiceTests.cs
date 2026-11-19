using DialoGame.Domain.Entities;
using DialoGame.Domain.Enums;
using DialoGame.Infrastructure.Services;
using FluentAssertions;

namespace DialoGame.Tests.Unit;

public class ModuleUnlockServiceTests
{
    private static Module BuildModule(int order, params Guid[] requiredActivityIds)
    {
        var module = new Module
        {
            Id = Guid.NewGuid(),
            Slug = $"modulo-{order:00}",
            Order = order,
        };

        foreach (var activityId in requiredActivityIds)
        {
            module.Activities.Add(new Activity
            {
                Id = activityId,
                ModuleId = module.Id,
                Slug = $"atividade-{activityId:N}",
                Order = module.Activities.Count + 1,
                IsRequired = true,
            });
        }

        return module;
    }

    private static ActivityProgress Completed(Guid userId, Guid activityId) => new()
    {
        UserId = userId,
        ActivityId = activityId,
        CompletedAt = DateTimeOffset.UtcNow,
    };

    [Fact]
    public void PrimeiroModuloEstaSempreLiberado()
    {
        var first = BuildModule(1, Guid.NewGuid());

        var statuses = ModuleUnlockService.Evaluate([first], []);

        statuses[first.Id].Should().Be(ModuleStatus.Current);
    }

    [Fact]
    public void ModuloSeguinteFicaBloqueadoSemConcluirOAnterior()
    {
        var first = BuildModule(1, Guid.NewGuid());
        var second = BuildModule(2, Guid.NewGuid());

        var statuses = ModuleUnlockService.Evaluate([first, second], []);

        statuses[first.Id].Should().Be(ModuleStatus.Current);
        statuses[second.Id].Should().Be(ModuleStatus.Locked);
    }

    [Fact]
    public void ModuloSeguinteLiberaQuandoOAnteriorEstaCompleto()
    {
        var firstActivity = Guid.NewGuid();
        var first = BuildModule(1, firstActivity);
        var second = BuildModule(2, Guid.NewGuid());
        var userId = Guid.NewGuid();

        var statuses = ModuleUnlockService.Evaluate(
            [first, second],
            [Completed(userId, firstActivity)]);

        statuses[first.Id].Should().Be(ModuleStatus.Completed);
        statuses[second.Id].Should().Be(ModuleStatus.Current);
    }

    [Fact]
    public void ModuloSoContaComoCompletoComTodasAsObrigatorias()
    {
        var activityA = Guid.NewGuid();
        var activityB = Guid.NewGuid();
        var module = BuildModule(1, activityA, activityB);
        var userId = Guid.NewGuid();

        var statuses = ModuleUnlockService.Evaluate([module], [Completed(userId, activityA)]);

        statuses[module.Id].Should().Be(ModuleStatus.Current);
    }

    [Fact]
    public void AtividadeOpcionalNaoImpedeConclusao()
    {
        var required = Guid.NewGuid();
        var module = BuildModule(1, required);
        module.Activities.Add(new Activity
        {
            Id = Guid.NewGuid(),
            ModuleId = module.Id,
            Slug = "extra",
            Order = 99,
            IsRequired = false,
        });

        var statuses = ModuleUnlockService.Evaluate(
            [module],
            [Completed(Guid.NewGuid(), required)]);

        statuses[module.Id].Should().Be(ModuleStatus.Completed);
    }

    [Fact]
    public void ModuloConcluidoContinuaAceitandoProgresso()
    {
        ModuleUnlockService.IsUnlocked(ModuleStatus.Completed).Should().BeTrue();
        ModuleUnlockService.IsUnlocked(ModuleStatus.Current).Should().BeTrue();
        ModuleUnlockService.IsUnlocked(ModuleStatus.Locked).Should().BeFalse();
    }

    [Fact]
    public void AvaliacaoRespeitaOrdemDosModulosMesmoForaDeOrdemNaLista()
    {
        var firstActivity = Guid.NewGuid();
        var first = BuildModule(1, firstActivity);
        var second = BuildModule(2, Guid.NewGuid());

        var statuses = ModuleUnlockService.Evaluate(
            [second, first],
            [Completed(Guid.NewGuid(), firstActivity)]);

        statuses[second.Id].Should().Be(ModuleStatus.Current);
    }
}
