using Application.Common.Interfaces;
using Application.Features.Auth.Dtos;
using Application.Features.Groups.Dtos;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands.VerifyEmail;

public class VerifyEmailHandler(IUserRepository repo, IUnitOfWork uow, IGroupRepository groupRepo)
    : IRequestHandler<VerifyEmailCommand, OperationResult<AuthResultDto>>
{
    public async Task<OperationResult<AuthResultDto>> Handle(VerifyEmailCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user  = await repo.GetByEmailAsync(email, ct);

        if (user is null || user.VerificationCode != request.Code.Trim())
            return OperationResult<AuthResultDto>.Fail("INVALID_CODE", "Invalid or expired verification code.");

        if (user.VerificationCodeExpiry < DateTime.UtcNow)
            return OperationResult<AuthResultDto>.Fail("CODE_EXPIRED", "Verification code has expired. Please register again.");

        user.IsEmailVerified        = true;
        user.VerificationCode       = null;
        user.VerificationCodeExpiry = null;
        await uow.SaveChangesAsync(ct);

        var memberships = await groupRepo.GetMembershipsByUserIdAsync(user.Id.ToString(), ct);
        var groups = memberships
            .Select(m => new UserGroupDto(m.GroupId, m.MemberId, m.GroupName, m.IsCreator))
            .ToList();

        return new AuthResultDto(user.Id, user.Email, user.DisplayName, user.AvatarColor, user.PhoneNumber, groups);
    }
}
