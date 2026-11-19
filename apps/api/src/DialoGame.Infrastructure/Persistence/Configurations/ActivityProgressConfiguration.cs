using DialoGame.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DialoGame.Infrastructure.Persistence.Configurations;

public class ActivityProgressConfiguration : IEntityTypeConfiguration<ActivityProgress>
{
    public void Configure(EntityTypeBuilder<ActivityProgress> builder)
    {
        builder.ToTable("activity_progress");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.BestScore).IsRequired();
        builder.Property(p => p.Attempts).IsRequired();
        builder.Property(p => p.Errors).IsRequired();
        builder.Property(p => p.Stars).IsRequired();
        builder.Property(p => p.UpdatedAt).IsRequired();

        // Um registro por par usuário/atividade: o upsert depende deste índice.
        builder.HasIndex(p => new { p.UserId, p.ActivityId })
            .IsUnique()
            .HasDatabaseName("ix_activity_progress_user_activity");

        builder.HasOne(p => p.User)
            .WithMany(u => u.Progress)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Activity)
            .WithMany()
            .HasForeignKey(p => p.ActivityId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
