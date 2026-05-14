using Domain.Common;

namespace Domain.Entities;

public class Group : Entity
{
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public string? CreatorUserId { get; set; }

    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
}
