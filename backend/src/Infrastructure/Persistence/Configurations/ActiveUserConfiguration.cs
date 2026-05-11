using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ActiveUserConfiguration : IEntityTypeConfiguration<ActiveUser>
{
    public void Configure(EntityTypeBuilder<ActiveUser> builder)
    {
        builder.HasKey(a => new { a.SubscriptionId, a.MemberId });

        builder.HasOne(a => a.Subscription)
            .WithOne(s => s.ActiveUser)
            .HasForeignKey<ActiveUser>(a => a.SubscriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Member)
            .WithMany()
            .HasForeignKey(a => a.MemberId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
