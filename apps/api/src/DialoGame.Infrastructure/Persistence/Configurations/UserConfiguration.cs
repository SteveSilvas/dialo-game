using DialoGame.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DialoGame.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Username).HasMaxLength(20).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(254);
        builder.Property(u => u.PasswordHash).HasMaxLength(512);
        builder.Property(u => u.GoogleId).HasMaxLength(64);
        builder.Property(u => u.DisplayName).HasMaxLength(80);
        builder.Property(u => u.AvatarUrl).HasMaxLength(512);
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(16);
        builder.Property(u => u.CreatedAt).IsRequired();

        // Normalizar para minúsculas na escrita deixa a unicidade case-insensitive
        // garantida pelo índice único comum, sem depender da extensão citext.
        builder.Property(u => u.Username)
            .HasConversion(v => v.ToLowerInvariant(), v => v);
        builder.Property(u => u.Email)
            .HasConversion(v => v == null ? null : v.ToLowerInvariant(), v => v);

        builder.HasIndex(u => u.Username).IsUnique().HasDatabaseName("ix_users_username");
        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasFilter("\"Email\" IS NOT NULL")
            .HasDatabaseName("ix_users_email");
        builder.HasIndex(u => u.GoogleId)
            .IsUnique()
            .HasFilter("\"GoogleId\" IS NOT NULL")
            .HasDatabaseName("ix_users_google_id");

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
