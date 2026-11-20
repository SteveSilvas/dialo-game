using System.Text.Json;
using DialoGame.Domain.Entities;
using DialoGame.Domain.Enums;

namespace DialoGame.Infrastructure.Persistence.Seed;

/// <summary>
/// Fonte do catálogo. As atividades espelham as que já existem no front
/// (Módulo 01), com o <c>config</c> descrevendo o que cada uma pede, para que
/// novos módulos entrem sem deploy do front.
/// </summary>
public static class CatalogData
{
    private static readonly string[] Alphabet =
        ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
         "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];

    private static readonly string[] Vowels = ["a", "e", "i", "o", "u"];

    private static readonly string[] Symbols =
        ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "+", "=", "[",
         "]", "{", "}", "|", ";", ":", "<", ">", "/", "?", ",", ".", "~"];

    public static List<Module> Build() =>
    [
        new Module
        {
            Slug = "modulo-01",
            Order = 1,
            Title = "Reconhecer símbolos",
            Description = "Distinguir letras, números, vogais e consoantes no meio de outros símbolos.",
            Concept = "Princípio alfabético",
            Activities =
            [
                Activity(
                    slug: "atividade-01",
                    order: 1,
                    title: "Selecionar as letras",
                    type: ActivityType.SelectSymbols,
                    config: new
                    {
                        predicate = "letter",
                        pool = new { alphabet = Alphabet, symbols = Symbols },
                        targetCount = 8,
                    }),
                Activity(
                    slug: "atividade-02",
                    order: 2,
                    title: "Selecionar os números",
                    type: ActivityType.SelectSymbols,
                    config: new
                    {
                        predicate = "number",
                        pool = new { numbers = new[] { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 }, symbols = Symbols },
                        targetCount = 8,
                    }),
                Activity(
                    slug: "atividade-03",
                    order: 3,
                    title: "Selecionar as vogais",
                    type: ActivityType.SelectSymbols,
                    config: new
                    {
                        predicate = "vowel",
                        pool = new { alphabet = Alphabet, symbols = Symbols },
                        targetCount = 5,
                    }),
                Activity(
                    slug: "atividade-04",
                    order: 4,
                    title: "Selecionar as consoantes",
                    type: ActivityType.SelectSymbols,
                    config: new
                    {
                        predicate = "consonant",
                        pool = new { alphabet = Alphabet, symbols = Symbols },
                        targetCount = 10,
                    }),
                Activity(
                    slug: "atividade-05",
                    order: 5,
                    title: "Desafio das consoantes",
                    type: ActivityType.DragSymbols,
                    config: new
                    {
                        predicate = "consonant",
                        pool = new { alphabet = Alphabet, symbols = Symbols },
                        targetCount = 12,
                        interaction = "drag",
                        vowels = Vowels,
                    }),
            ],
        },

        // Módulos 02 e 03 entram com o conteúdo mínimo para a progressão ser
        // verificável de ponta a ponta: sem um segundo e um terceiro módulo não
        // existe "desbloqueou" nem "segue bloqueado" para testar. As atividades
        // pedagógicas completas são a Fase 4 (issues #29 e #30).
        new Module
        {
            Slug = "modulo-02",
            Order = 2,
            Title = "Sons das letras",
            Description = "Reconhecer o som inicial das palavras e as rimas.",
            Concept = "Consciência fonológica",
            Activities =
            [
                Activity(
                    slug: "modulo-02-atividade-01",
                    order: 1,
                    title: "Com que som começa?",
                    type: ActivityType.SelectSymbols,
                    config: new
                    {
                        predicate = "initialSound",
                        prompt = "BOLA",
                        answer = "b",
                        distractors = new[] { "d", "p", "t" },
                        targetCount = 1,
                    }),
            ],
        },

        new Module
        {
            Slug = "modulo-03",
            Order = 3,
            Title = "Sílabas",
            Description = "Contar sílabas e juntar pedaços para formar palavras.",
            Concept = "Consciência silábica",
            Activities =
            [
                Activity(
                    slug: "modulo-03-atividade-01",
                    order: 1,
                    title: "Junte as sílabas",
                    type: ActivityType.BuildWord,
                    config: new
                    {
                        predicate = "syllableJoin",
                        word = "BALA",
                        syllables = new[] { "BA", "LA" },
                        targetCount = 1,
                    }),
            ],
        },
    ];

    private static Activity Activity(
        string slug,
        int order,
        string title,
        ActivityType type,
        object config) => new()
        {
            Slug = slug,
            Order = order,
            Title = title,
            Type = type,
            IsRequired = true,
            Config = JsonSerializer.SerializeToDocument(config),
        };
}
