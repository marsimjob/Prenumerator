using Api.Endpoints.Auth;
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

    builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
        .WithOrigins("http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddScoped<IFeedNotifier, SignalRFeedNotifier>();

    var app = builder.Build();

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseCors();
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
        app.MapOpenApi();

    app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

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
