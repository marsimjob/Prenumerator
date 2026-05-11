using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class EfGroupRepository(AppDbContext context)
    : EfRepository<Group>(context), IGroupRepository
{
    public async Task<Group?> GetByInviteCodeAsync(string inviteCode, CancellationToken ct = default)
        => await Context.Groups
            .Include(g => g.Members)
            .FirstOrDefaultAsync(g => g.InviteCode == inviteCode, ct);

    public async Task<Group?> GetWithMembersAsync(Guid id, CancellationToken ct = default)
        => await Context.Groups
            .Include(g => g.Members)
            .Include(g => g.Subscriptions)
            .FirstOrDefaultAsync(g => g.Id == id, ct);

    public async Task AddMemberAsync(GroupMember member, CancellationToken ct = default)
        => await Context.GroupMembers.AddAsync(member, ct);
}
