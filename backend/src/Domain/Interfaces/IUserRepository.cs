using Domain.Entities;

namespace Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
    Task<User?> GetByVerificationCodeAsync(string code, CancellationToken ct = default);
    Task<IReadOnlyList<User>> GetByStringIdsAsync(IEnumerable<string> ids, CancellationToken ct = default);
}
