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

        // Módulos 02 e 03 (Fase 4, issues #29 e #30). O conteúdo ainda não foi
        // revisado por educador: é um ponto de partida que cobre os conceitos de
        // cada módulo, não um currículo validado.
        new Module
        {
            Slug = "modulo-02",
            Order = 2,
            Title = "Sons das letras",
            Description = "Reconhecer o som inicial das palavras e as rimas.",
            Concept = "Consciência fonológica",
            Activities =
            [
                // A palavra falada nunca está entre as opções: se estivesse, a
                // criança só parearia o som com o rótulo igual e a atividade
                // não mediria consciência fonológica nenhuma.
                Activity(
                    slug: "modulo-02-atividade-01",
                    order: 1,
                    title: "Mesmo som inicial",
                    type: ActivityType.SelectPicture,
                    config: new
                    {
                        prompt = "QUAL FIGURA COMEÇA COM O MESMO SOM?",
                        speak = "Bola",
                        answer = "Bala",
                        options = new[]
                        {
                            new { label = "Bala", emoji = "🍬" },
                            new { label = "Dado", emoji = "🎲" },
                            new { label = "Pato", emoji = "🦆" },
                        },
                    }),
                Activity(
                    slug: "modulo-02-atividade-02",
                    order: 2,
                    title: "Outro som inicial",
                    type: ActivityType.SelectPicture,
                    config: new
                    {
                        prompt = "QUAL FIGURA COMEÇA COM O MESMO SOM?",
                        speak = "Sapo",
                        answer = "Sino",
                        options = new[]
                        {
                            new { label = "Sino", emoji = "🔔" },
                            new { label = "Bola", emoji = "⚽" },
                            new { label = "Dado", emoji = "🎲" },
                        },
                    }),
                Activity(
                    slug: "modulo-02-atividade-03",
                    order: 3,
                    title: "Qual rima?",
                    type: ActivityType.SelectPicture,
                    config: new
                    {
                        prompt = "QUAL FIGURA RIMA COM A PALAVRA OUVIDA?",
                        speak = "Gato",
                        answer = "Pato",
                        options = new[]
                        {
                            new { label = "Pato", emoji = "🦆" },
                            new { label = "Bola", emoji = "⚽" },
                            new { label = "Casa", emoji = "🏠" },
                        },
                    }),
                Activity(
                    slug: "modulo-02-atividade-04",
                    order: 4,
                    title: "Outra rima",
                    type: ActivityType.SelectPicture,
                    config: new
                    {
                        prompt = "QUAL FIGURA RIMA COM A PALAVRA OUVIDA?",
                        speak = "Rato",
                        answer = "Gato",
                        options = new[]
                        {
                            new { label = "Gato", emoji = "🐱" },
                            new { label = "Dado", emoji = "🎲" },
                            new { label = "Casa", emoji = "🏠" },
                        },
                    }),
                Activity(
                    slug: "modulo-02-atividade-05",
                    order: 5,
                    title: "Mesmo som final",
                    type: ActivityType.SelectPicture,
                    config: new
                    {
                        prompt = "QUAL FIGURA TERMINA COM O MESMO SOM?",
                        speak = "Casa",
                        answer = "Rosa",
                        options = new[]
                        {
                            new { label = "Rosa", emoji = "🌹" },
                            new { label = "Pato", emoji = "🦆" },
                            new { label = "Dado", emoji = "🎲" },
                        },
                    }),
            ],
        },

        new Module
        {
            Slug = "modulo-03",
            Order = 3,
            Title = "Sílabas",
            Description = "Juntar pedaços para formar palavras.",
            Concept = "Consciência silábica",
            // Módulo 03 da Fase 4 (#30). As atividades são de montar palavra:
            // a resposta é verificável pela própria palavra, sem depender de
            // áudio nem de julgamento do enunciado. As de contar e separar
            // sílabas ficam para quando houver componente próprio.
            Activities =
            [
                Activity(
                    slug: "modulo-03-atividade-01",
                    order: 1,
                    title: "Junte as sílabas",
                    type: ActivityType.BuildWord,
                    config: new
                    {
                        prompt = "MONTE A PALAVRA: BALA",
                        word = "BALA",
                        syllables = new[] { "BA", "LA" },
                    }),
                Activity(
                    slug: "modulo-03-atividade-02",
                    order: 2,
                    title: "Três sílabas",
                    type: ActivityType.BuildWord,
                    config: new
                    {
                        prompt = "MONTE A PALAVRA: BANANA",
                        word = "BANANA",
                        syllables = new[] { "BA", "NA", "NA" },
                    }),
                Activity(
                    slug: "modulo-03-atividade-03",
                    order: 3,
                    title: "Palavra de quatro sílabas",
                    type: ActivityType.BuildWord,
                    config: new
                    {
                        prompt = "MONTE A PALAVRA: BORBOLETA",
                        word = "BORBOLETA",
                        syllables = new[] { "BOR", "BO", "LE", "TA" },
                    }),
                Activity(
                    slug: "modulo-03-atividade-04",
                    order: 4,
                    title: "Sílabas com acento",
                    type: ActivityType.BuildWord,
                    config: new
                    {
                        prompt = "MONTE A PALAVRA: PÁSSARO",
                        word = "PÁSSARO",
                        syllables = new[] { "PÁS", "SA", "RO" },
                    }),
                Activity(
                    slug: "modulo-03-atividade-05",
                    order: 5,
                    title: "Palavra comprida",
                    type: ActivityType.BuildWord,
                    config: new
                    {
                        prompt = "MONTE A PALAVRA: JACARÉ",
                        word = "JACARÉ",
                        syllables = new[] { "JA", "CA", "RÉ" },
                    }),
            ],
        },

        new Module
        {
            Slug = "modulo-04",
            Order = 4,
            Title = "Formar palavras",
            Description = "Completar a palavra com a sílaba que falta.",
            Concept = "Síntese silábica",
            // Módulo 04 da Fase 4 (#31). O módulo 03 monta a palavra inteira a
            // partir das sílabas; repetir isso aqui não acrescentaria nada. A
            // atividade é a inversa: a palavra aparece com um buraco e a criança
            // escolhe a sílaba que o fecha. As opções erradas diferem só na
            // vogal — é a discriminação fina que a síntese exige, e é o que
            // separa esta atividade de um simples "qual sílaba combina".
            //
            // Nenhuma palavra se repete em relação aos módulos 02 e 03: repetir
            // o mesmo item faria a criança decorar a resposta em vez de ler.
            Activities =
            [
                Activity(
                    slug: "modulo-04-atividade-01",
                    order: 1,
                    title: "A primeira sílaba",
                    type: ActivityType.CompleteWord,
                    config: new
                    {
                        prompt = "QUAL SÍLABA FALTA?",
                        emoji = "🪟",
                        word = "JANELA",
                        syllables = new[] { "JA", "NE", "LA" },
                        missingIndex = 0,
                        answer = "JA",
                        options = new[] { "JA", "JE", "JO" },
                    }),
                Activity(
                    slug: "modulo-04-atividade-02",
                    order: 2,
                    title: "A sílaba do meio",
                    type: ActivityType.CompleteWord,
                    config: new
                    {
                        prompt = "QUAL SÍLABA FALTA?",
                        emoji = "👟",
                        word = "SAPATO",
                        syllables = new[] { "SA", "PA", "TO" },
                        missingIndex = 1,
                        answer = "PA",
                        options = new[] { "PA", "PO", "PE" },
                    }),
                Activity(
                    slug: "modulo-04-atividade-03",
                    order: 3,
                    title: "A última sílaba",
                    type: ActivityType.CompleteWord,
                    config: new
                    {
                        prompt = "QUAL SÍLABA FALTA?",
                        emoji = "🐴",
                        word = "CAVALO",
                        syllables = new[] { "CA", "VA", "LO" },
                        missingIndex = 2,
                        answer = "LO",
                        options = new[] { "LO", "LA", "LE" },
                    }),
                // A partir daqui a dificuldade sobe pela extensão da palavra, não
                // por repetir a mesma posição: uma palavra de duas sílabas esconde
                // metade dela, e a de quatro sílabas esconde uma sílaba do meio
                // com mais material em volta para a criança segurar.
                Activity(
                    slug: "modulo-04-atividade-04",
                    order: 4,
                    title: "Palavra de duas sílabas",
                    type: ActivityType.CompleteWord,
                    config: new
                    {
                        prompt = "QUAL SÍLABA FALTA?",
                        emoji = "🕯️",
                        word = "VELA",
                        syllables = new[] { "VE", "LA" },
                        missingIndex = 0,
                        answer = "VE",
                        options = new[] { "VE", "VA", "VO" },
                    }),
                Activity(
                    slug: "modulo-04-atividade-05",
                    order: 5,
                    title: "Palavra de quatro sílabas",
                    type: ActivityType.CompleteWord,
                    config: new
                    {
                        prompt = "QUAL SÍLABA FALTA?",
                        emoji = "🐢",
                        word = "TARTARUGA",
                        syllables = new[] { "TAR", "TA", "RU", "GA" },
                        missingIndex = 2,
                        answer = "RU",
                        options = new[] { "RU", "RA", "RO" },
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
