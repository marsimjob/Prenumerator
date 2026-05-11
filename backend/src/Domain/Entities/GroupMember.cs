using Domain.Common;

namespace Domain.Entities;

public class GroupMember : Entity
{
    public Guid GroupId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = "#6366f1";

    public Group Group { get; set; } = null!;
    public ICollection<SubscriptionMember> SubscriptionMemberships { get; set; } = new List<SubscriptionMember>();
}
