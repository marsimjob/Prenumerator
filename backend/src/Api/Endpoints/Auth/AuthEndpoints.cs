using Application.Features.Auth.Commands.Login;
using Application.Features.Auth.Commands.Register;
using Application.Features.Auth.Commands.UpdatePhone;
using MediatR;

namespace Api.Endpoints.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");
        auth.MapPost("/register",           Register);
        auth.MapPost("/login",              Login);
        auth.MapPut("/{userId:guid}/phone", UpdatePhone);
    }

    private static async Task<IResult> Register(
        RegisterRequest req, ISender sender, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || req.Username.Length < 3)
            return Results.BadRequest(new { error = "Username must be at least 3 characters." });

        if (req.Password.Length < 6)
            return Results.BadRequest(new { error = "Password must be at least 6 characters." });

        var result = await sender.Send(
            new RegisterCommand(req.Username, req.Password, req.DisplayName, req.AvatarColor, req.PhoneNumber), ct);

        return result.IsSuccess
            ? Results.Created("/api/auth/me", result.Value)
            : Results.Conflict(result.Error);
    }

    private static async Task<IResult> Login(
        LoginRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new LoginCommand(req.Username, req.Password), ct);
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.Unauthorized();
    }

    private static async Task<IResult> UpdatePhone(
        Guid userId, UpdatePhoneRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new UpdatePhoneCommand(userId, req.PhoneNumber), ct);
        return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
    }
}

public record RegisterRequest(string Username, string Password, string DisplayName, string AvatarColor, string? PhoneNumber);
public record LoginRequest(string Username, string Password);
public record UpdatePhoneRequest(string? PhoneNumber);
