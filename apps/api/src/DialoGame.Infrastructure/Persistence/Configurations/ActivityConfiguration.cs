using DialoGame.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DialoGame.Infrastructure.Persistence.Configurations;

public class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.ToTable("activities");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Slug).HasMaxLength(64).IsRequired();
        builder.Property(a => a.Title).HasMaxLength(120).IsRequired();
        builder.Property(a => a.Type).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(a => a.IsRequired).IsRequired();
        builder.Property(a => a.Order).IsRequired();

        builder.Property(a => a.Config)
            .HasColumnType("jsonb")
            .IsRequired();

        builder.HasIndex(a => a.Slug).IsUnique().HasDatabaseName("ix_activities_slug");
        builder.HasIndex(a => new { a.ModuleId, a.Order }).IsUnique()
            .HasDatabaseName("ix_activities_module_order");
    }
}
