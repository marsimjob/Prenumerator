using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Persistence;

// Used by `dotnet ef migrations` at design time — not wired into runtime DI.
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(
                "Server=localhost,1433;Database=kompisgaang;User Id=sa;Password=Kompisg@ang123;TrustServerCertificate=True;MultipleActiveResultSets=True")
            .Options;

        return new AppDbContext(options);
    }
}
