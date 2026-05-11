using Domain.Entities;

namespace Domain.Interfaces;

public interface ISubscriptionRepository : IRepository<Subscription>
{
    Task<IReadOnlyList<Subscription>> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default);
    Task<Subscription?> GetWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<Subscription?> GetWithCredentialAsync(Guid id, CancellationToken ct = default);
    Task AddSubscriptionMemberAsync(Domain.Entities.SubscriptionMember member, CancellationToken ct = default);
}
