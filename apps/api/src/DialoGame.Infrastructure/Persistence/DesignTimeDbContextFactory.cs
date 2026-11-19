using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DialoGame.Infrastructure.Persistence;

/// <summary>
/// Usado apenas pelas ferramentas do EF Core (migrations). Manter a criação do
/// contexto aqui evita que o projeto da API precise do pacote de design só para
/// gerar migrations, e permite rodar <c>dotnet ef</c> com a Infrastructure como
/// projeto de inicialização.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<DialoGameDbContext>
{
    public DialoGameDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=localhost;Port=5432;Database=dialo_game;Username=dialo;Password=dialo_dev";

        var options = new DbContextOptionsBuilder<DialoGameDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new DialoGameDbContext(options);
    }
}
