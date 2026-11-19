using DialoGame.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DialoGame.Infrastructure.Persistence;

public class DialoGameDbContext(DbContextOptions<DialoGameDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Module> Modules => Set<Module>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<ActivityProgress> ActivityProgress => Set<ActivityProgress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DialoGameDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
