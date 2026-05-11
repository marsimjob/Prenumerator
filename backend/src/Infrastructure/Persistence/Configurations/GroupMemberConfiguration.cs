using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class GroupMemberConfiguration : IEntityTypeConfiguration<GroupMember>
{
    public void Configure(EntityTypeBuilder<GroupMember> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.UserId).HasMaxLength(256).IsRequired();
        builder.Property(m => m.DisplayName).HasMaxLength(100).IsRequired();
        builder.Property(m => m.AvatarColor).HasMaxLength(7).IsRequired().HasDefaultValue("#6366f1");
        builder.HasIndex(m => new { m.GroupId, m.UserId }).IsUnique();
    }
}
