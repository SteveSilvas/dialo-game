using DialoGame.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DialoGame.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TokenHash).HasMaxLength(64).IsRequired();
        builder.Property(t => t.UserAgent).HasMaxLength(256);
        builder.Property(t => t.CreatedAt).IsRequired();
        builder.Property(t => t.ExpiresAt).IsRequired();

        builder.HasIndex(t => t.TokenHash).IsUnique().HasDatabaseName("ix_refresh_tokens_token_hash");
        builder.HasIndex(t => t.FamilyId).HasDatabaseName("ix_refresh_tokens_family_id");
        builder.HasIndex(t => new { t.UserId, t.ExpiresAt }).HasDatabaseName("ix_refresh_tokens_user_expires");
    }
}
