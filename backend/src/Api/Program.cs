using Api.Endpoints.Auth;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using Api.Endpoints.Credentials;
using Api.Endpoints.Groups;
using Api.Endpoints.Subscriptions;
using Api.Hubs;
using Api.Middleware;
using Api.Services;
using Application;
using Application.Common.Interfaces;
using Infrastructure;
using Serilog;

LoadEnvFile();

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, cfg) => cfg
        .ReadFrom.Configuration(ctx.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console()
        .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day));

    builder.Services.AddOpenApi();
    builder.Services.AddSignalR();

    var corsOrigin = builder.Configuration["CORS_ORIGIN"]
        ?? Environment.GetEnvironmentVariable("CORS_ORIGIN")
        ?? "http://localhost:5173";
    builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
        .WithOrigins(corsOrigin, "https://thriving-hamster-3df49e.netlify.app")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddScoped<IFeedNotifier, SignalRFeedNotifier>();

    var app = builder.Build();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseCors();
    app.UseSerilogRequestLogging();

    app.MapOpenApi();
    app.MapScalarApiReference();

    app.MapGet("/health", (IConfiguration cfg) => Results.Ok(new {
        status = "ok",
        encKeyLength = Convert.FromBase64String(cfg["ENCRYPTION_KEY"] ?? Environment.GetEnvironmentVariable("ENCRYPTION_KEY") ?? "").Length
    }));

    app.MapAuthEndpoints();
    app.MapGroupEndpoints();
    app.MapSubscriptionEndpoints();
    app.MapCredentialEndpoints();
    app.MapHub<FeedHub>("/hubs/feed");

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Walks up from the working directory to find the nearest .env file.
static void LoadEnvFile()
{
    var dir = new DirectoryInfo(Directory.GetCurrentDirectory());
    while (dir is not null)
    {
        var candidate = Path.Combine(dir.FullName, ".env");
        if (File.Exists(candidate))
        {
            foreach (var line in File.ReadAllLines(candidate))
            {
                var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
                var idx = trimmed.IndexOf('=');
                if (idx < 0) continue;
                var key = trimmed[..idx].Trim();
                var val = trimmed[(idx + 1)..].Trim();
                if (Environment.GetEnvironmentVariable(key) is null)
                    Environment.SetEnvironmentVariable(key, val);
            }
            return;
        }
        dir = dir.Parent;
    }
}
