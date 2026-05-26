using Application.Features.Auth.Commands.ForgotPassword;
using Application.Features.Auth.Commands.Login;
using Application.Features.Auth.Commands.Register;
using Application.Features.Auth.Commands.UpdatePhone;
using Application.Features.Auth.Commands.VerifyEmail;
using MediatR;

namespace Api.Endpoints.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");
        auth.MapPost("/register",           Register);
        auth.MapPost("/verify-email",       VerifyEmail);
        auth.MapPost("/login",              Login);
        auth.MapPost("/forgot-password",    ForgotPassword);
        auth.MapPut("/{userId:guid}/phone", UpdatePhone);
    }

    private static async Task<IResult> Register(
        RegisterRequest req, ISender sender, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@'))
            return Results.BadRequest(new { error = "A valid email address is required." });

        if (req.Password.Length < 6)
            return Results.BadRequest(new { error = "Password must be at least 6 characters." });

        var result = await sender.Send(
            new RegisterCommand(req.Email, req.Password, req.DisplayName, req.AvatarColor, req.PhoneNumber), ct);

        return result.IsSuccess
            ? Results.Ok(new { message = "Verification email sent. Please check your inbox." })
            : Results.Conflict(result.Error);
    }

    private static async Task<IResult> VerifyEmail(
        VerifyEmailRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new VerifyEmailCommand(req.Email, req.Code), ct);
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.BadRequest(result.Error);
    }

    private static async Task<IResult> Login(
        LoginRequest req, ISender sender, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email))
            return Results.Unauthorized();

        var result = await sender.Send(new LoginCommand(req.Email, req.Password), ct);
        if (!result.IsSuccess)
        {
            return result.Error.Code == "EMAIL_NOT_VERIFIED"
                ? Results.BadRequest(result.Error)
                : Results.Unauthorized();
        }
        return Results.Ok(result.Value);
    }

    private static async Task<IResult> ForgotPassword(
        ForgotPasswordRequest req, ISender sender, CancellationToken ct)
    {
        await sender.Send(new ForgotPasswordCommand(req.Email), ct);
        return Results.Ok(new { message = "If that email is registered, a new password has been sent." });
    }

    private static async Task<IResult> UpdatePhone(
        Guid userId, UpdatePhoneRequest req, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new UpdatePhoneCommand(userId, req.PhoneNumber), ct);
        return result.IsSuccess ? Results.NoContent() : Results.NotFound(result.Error);
    }
}

public record RegisterRequest(string Email, string Password, string DisplayName, string AvatarColor, string? PhoneNumber);
public record VerifyEmailRequest(string Email, string Code);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record UpdatePhoneRequest(string? PhoneNumber);
