namespace DialoGame.Domain.Enums;

/// <summary>
/// Estado de um módulo para um usuário. Calculado, nunca persistido.
/// </summary>
public enum ModuleStatus
{
    /// <summary>Módulos anteriores ainda não concluídos.</summary>
    Locked = 0,

    /// <summary>Primeiro módulo liberado que ainda não foi concluído.</summary>
    Current = 1,

    /// <summary>Todas as atividades obrigatórias concluídas.</summary>
    Completed = 2,
}
