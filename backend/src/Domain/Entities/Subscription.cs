using Domain.Common;
using Domain.Enums;

namespace Domain.Entities;

public class Subscription : Entity
{
    public Guid GroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#E50914";
    public WatchMode WatchMode { get; set; } = WatchMode.Exclusive;
    public decimal Price { get; set; }
    public BillingCycle BillingCycle { get; set; }
    public Guid OwnerId { get; set; }

    public Group Group { get; set; } = null!;
    public GroupMember Owner { get; set; } = null!;
    public ICollection<SubscriptionMember> Members { get; set; } = new List<SubscriptionMember>();
    public Credential? Credential { get; set; }
    public ActiveUser? ActiveUser { get; set; }
}
