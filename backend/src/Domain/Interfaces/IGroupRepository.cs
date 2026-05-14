using Domain.Entities;

namespace Domain.Interfaces;

public interface IGroupRepository : IRepository<Group>
{
    Task<Group?> GetByInviteCodeAsync(string inviteCode, CancellationToken ct = default);
    Task<Group?> GetWithMembersAsync(Guid id, CancellationToken ct = default);
    Task AddMemberAsync(GroupMember member, CancellationToken ct = default);
    Task<List<(Guid GroupId, Guid MemberId, string GroupName, bool IsCreator)>> GetMembershipsByUserIdAsync(string userId, CancellationToken ct = default);
}
