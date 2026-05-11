using Domain.Common;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public abstract class EfRepository<T>(AppDbContext context) : IRepository<T>
    where T : Entity
{
    protected readonly AppDbContext Context = context;

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await Context.Set<T>().FindAsync([id], ct);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken ct = default)
        => await Context.Set<T>().AsNoTracking().ToListAsync(ct);

    public async Task AddAsync(T entity, CancellationToken ct = default)
        => await Context.Set<T>().AddAsync(entity, ct);

    public void Update(T entity)
        => Context.Set<T>().Update(entity);

    public void Delete(T entity)
        => Context.Set<T>().Remove(entity);
}
