using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands.Register;

public class RegisterHandler(IUserRepository repo, IUnitOfWork uow, IPasswordHasher hasher, IEmailService emailService)
    : IRequestHandler<RegisterCommand, OperationResult<string>>
{
    public async Task<OperationResult<string>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await repo.EmailExistsAsync(email, ct))
            return OperationResult<string>.Fail("EMAIL_TAKEN", "An account with that email already exists.");

        var code = Random.Shared.Next(100000, 999999).ToString();

        var user = new User
        {
            Id                     = Guid.NewGuid(),
            Email                  = email,
            PasswordHash           = hasher.Hash(request.Password),
            DisplayName            = request.DisplayName.Trim(),
            AvatarColor            = request.AvatarColor,
            PhoneNumber            = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            IsEmailVerified        = false,
            VerificationCode       = code,
            VerificationCodeExpiry = DateTime.UtcNow.AddHours(24),
        };

        await repo.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);
        await emailService.SendVerificationCodeAsync(email, code, ct);

        return OperationResult<string>.Ok("VERIFICATION_SENT");
    }
}
