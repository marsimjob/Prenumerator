using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class EfUserRepository(AppDbContext context)
    : EfRepository<User>(context), IUserRepository
{
    public async Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default)
        => await Context.Users.FirstOrDefaultAsync(u => u.Username == username, ct);

    public async Task<bool> UsernameExistsAsync(string username, CancellationToken ct = default)
        => await Context.Users.AnyAsync(u => u.Username == username, ct);

    public async Task<IReadOnlyList<User>> GetByStringIdsAsync(IEnumerable<string> ids, CancellationToken ct = default)
    {
        var guids = ids
            .Select(id => Guid.TryParse(id, out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .ToHashSet();
        return await Context.Users.Where(u => guids.Contains(u.Id)).ToListAsync(ct);
    }
}
