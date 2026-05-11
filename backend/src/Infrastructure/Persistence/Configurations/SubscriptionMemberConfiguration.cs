using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SubscriptionMemberConfiguration : IEntityTypeConfiguration<SubscriptionMember>
{
    public void Configure(EntityTypeBuilder<SubscriptionMember> builder)
    {
        builder.HasKey(sm => new { sm.SubscriptionId, sm.MemberId });
        builder.Property(sm => sm.IsActive).IsRequired().HasDefaultValue(false);

        builder.HasOne(sm => sm.Subscription)
            .WithMany(s => s.Members)
            .HasForeignKey(sm => sm.SubscriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        // NoAction avoids multiple cascade paths from GroupMember → Subscription → SubscriptionMember
        builder.HasOne(sm => sm.Member)
            .WithMany(m => m.SubscriptionMemberships)
            .HasForeignKey(sm => sm.MemberId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
