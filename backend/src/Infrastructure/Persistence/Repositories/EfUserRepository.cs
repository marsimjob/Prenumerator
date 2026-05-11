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
}
