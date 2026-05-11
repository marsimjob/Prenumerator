using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class EfSubscriptionRepository(AppDbContext context)
    : EfRepository<Subscription>(context), ISubscriptionRepository
{
    public async Task<IReadOnlyList<Subscription>> GetByGroupIdAsync(Guid groupId, CancellationToken ct = default)
        => await Context.Subscriptions
            .Include(s => s.Owner)
            .Include(s => s.Members).ThenInclude(m => m.Member)
            .Include(s => s.ActiveUser)
            .Where(s => s.GroupId == groupId)
            .ToListAsync(ct);

    public async Task<Subscription?> GetWithDetailsAsync(Guid id, CancellationToken ct = default)
        => await Context.Subscriptions
            .Include(s => s.Owner)
            .Include(s => s.Members).ThenInclude(m => m.Member)
            .Include(s => s.ActiveUser)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task<Subscription?> GetWithCredentialAsync(Guid id, CancellationToken ct = default)
        => await Context.Subscriptions
            .Include(s => s.Credential)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

    public async Task AddSubscriptionMemberAsync(Domain.Entities.SubscriptionMember member, CancellationToken ct = default)
        => await Context.SubscriptionMembers.AddAsync(member, ct);
}
