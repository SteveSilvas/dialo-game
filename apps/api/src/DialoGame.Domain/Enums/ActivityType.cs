namespace DialoGame.Domain.Enums;

/// <summary>
/// Tipo de atividade. Define como o front renderiza e como o <c>Config</c> é interpretado.
/// </summary>
public enum ActivityType
{
    /// <summary>Selecionar símbolos que satisfazem um predicado (letras, números, vogais, consoantes).</summary>
    SelectSymbols = 0,

    /// <summary>Arrastar símbolos para a zona correta.</summary>
    DragSymbols = 1,

    /// <summary>Combinar sílabas para formar uma palavra.</summary>
    BuildWord = 2,

    /// <summary>Ler e responder sobre uma frase.</summary>
    ReadSentence = 3,

    /// <summary>Ouvir uma palavra e escolher a figura que corresponde ao som.</summary>
    SelectPicture = 4,
}
