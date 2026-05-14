using Domain.Entities;

namespace Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default);
    Task<bool> UsernameExistsAsync(string username, CancellationToken ct = default);
    Task<IReadOnlyList<User>> GetByStringIdsAsync(IEnumerable<string> ids, CancellationToken ct = default);
}
