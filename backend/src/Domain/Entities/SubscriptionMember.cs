namespace Domain.Entities;

public class SubscriptionMember
{
    public Guid SubscriptionId { get; set; }
    public Guid MemberId { get; set; }
    public bool IsActive { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Subscription Subscription { get; set; } = null!;
    public GroupMember Member { get; set; } = null!;
}
