using System.ComponentModel.DataAnnotations;

namespace DialoGame.Api.Contracts;

public record ActivityProgressBody(
    [Range(0, 1000)] int BestScore,
    [Range(0, 1000)] int Attempts,
    [Range(0, 1000)] int Errors,
    bool Completed);

public record ImportProgressBody(
    [Required] IReadOnlyList<ImportProgressItem> Items);

public record ImportProgressItem(
    [Required] string ActivitySlug,
    [Range(0, 1000)] int BestScore,
    [Range(0, 1000)] int Attempts,
    [Range(0, 1000)] int Errors,
    bool Completed);

public record ImportProgressResponse(int Imported);
