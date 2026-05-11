using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class CredentialConfiguration : IEntityTypeConfiguration<Credential>
{
    public void Configure(EntityTypeBuilder<Credential> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.UsernameEncrypted).IsRequired();
        builder.Property(c => c.PasswordEncrypted).IsRequired();

        builder.HasOne(c => c.Subscription)
            .WithOne(s => s.Credential)
            .HasForeignKey<Credential>(c => c.SubscriptionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
