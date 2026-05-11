using Domain.Common;

namespace Domain.Entities;

public class Credential : Entity
{
    public Guid SubscriptionId { get; set; }

    // AES-256 encrypted before write; decrypted after read in Application layer.
    public string UsernameEncrypted { get; set; } = string.Empty;
    public string PasswordEncrypted { get; set; } = string.Empty;

    public Subscription Subscription { get; set; } = null!;
}
