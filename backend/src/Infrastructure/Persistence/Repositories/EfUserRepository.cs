using Domain.Entities;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class EfUserRepository(AppDbContext context)
    : EfRepository<User>(context), IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await Context.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

    public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
        => await Context.Users.AnyAsync(u => u.Email == email, ct);

    public async Task<User?> GetByVerificationCodeAsync(string code, CancellationToken ct = default)
        => await Context.Users.FirstOrDefaultAsync(u => u.VerificationCode == code, ct);

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
