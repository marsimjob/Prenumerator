using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).HasMaxLength(100).IsRequired();
        builder.Property(s => s.Color).HasMaxLength(7).IsRequired().HasDefaultValue("#E50914");
        builder.Property(s => s.Price).HasPrecision(18, 2).IsRequired();
        builder.Property(s => s.BillingCycle).HasConversion<string>().HasMaxLength(20).IsRequired();
        builder.Property(s => s.WatchMode).HasConversion<string>().HasMaxLength(20).IsRequired();

        // Owner: restrict delete so a sub isn't cascade-deleted when owner leaves
        builder.HasOne(s => s.Owner)
            .WithMany()
            .HasForeignKey(s => s.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
