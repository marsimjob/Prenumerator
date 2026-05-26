using Application.Common.Interfaces;
using Domain.Interfaces;
using Infrastructure.Persistence;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("CONNECTION_STRING")
            ?? configuration["CONNECTION_STRING"];
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseSqlServer(connectionString));

        services.Configure<EncryptionOptions>(o =>
            o.Key = configuration["ENCRYPTION_KEY"]
                ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY")
                ?? "OwMXYubiMkxtic/lGsTydglwEu085xQULu9Vs27fyWM=");

        services.AddSingleton<IEncryptionService, AesEncryptionService>();

        services.AddScoped<IGroupRepository,        EfGroupRepository>();
        services.AddScoped<ISubscriptionRepository, EfSubscriptionRepository>();
        services.AddScoped<IUserRepository,         EfUserRepository>();
        services.AddScoped<IUnitOfWork,             UnitOfWork>();
        services.AddSingleton<IPasswordHasher,      PasswordHasher>();
        services.AddScoped<IEmailService,           SendGridEmailService>();

        return services;
    }
}
