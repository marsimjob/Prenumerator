namespace Domain.Entities;

public class ActiveUser
{
    public Guid Id { get; set; }
    public Guid SubscriptionId { get; set; }
    public Guid MemberId { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Subscription Subscription { get; set; } = null!;
    public GroupMember Member { get; set; } = null!;
}
