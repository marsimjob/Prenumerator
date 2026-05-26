using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands.ForgotPassword;

public class ForgotPasswordHandler(IUserRepository repo, IUnitOfWork uow, IPasswordHasher hasher, IEmailService emailService)
    : IRequestHandler<ForgotPasswordCommand, OperationResult>
{
    private const string Chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";

    public async Task<OperationResult> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user  = await repo.GetByEmailAsync(email, ct);

        // Always return success to prevent email enumeration.
        if (user is null || !user.IsEmailVerified)
            return OperationResult.Ok();

        var newPassword = GeneratePassword(12);
        user.PasswordHash = hasher.Hash(newPassword);
        await uow.SaveChangesAsync(ct);
        await emailService.SendNewPasswordAsync(email, newPassword, ct);

        return OperationResult.Ok();
    }

    private static string GeneratePassword(int length)
    {
        var chars = new char[length];
        for (var i = 0; i < length; i++)
            chars[i] = Chars[Random.Shared.Next(Chars.Length)];
        return new string(chars);
    }
}
