using DialoGame.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DialoGame.Infrastructure.Persistence.Configurations;

public class ModuleConfiguration : IEntityTypeConfiguration<Module>
{
    public void Configure(EntityTypeBuilder<Module> builder)
    {
        builder.ToTable("modules");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Slug).HasMaxLength(64).IsRequired();
        builder.Property(m => m.Title).HasMaxLength(120).IsRequired();
        builder.Property(m => m.Description).HasMaxLength(512).IsRequired();
        builder.Property(m => m.Concept).HasMaxLength(120).IsRequired();
        builder.Property(m => m.Order).IsRequired();

        builder.HasIndex(m => m.Slug).IsUnique().HasDatabaseName("ix_modules_slug");
        builder.HasIndex(m => m.Order).IsUnique().HasDatabaseName("ix_modules_order");

        builder.HasMany(m => m.Activities)
            .WithOne(a => a.Module)
            .HasForeignKey(a => a.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
