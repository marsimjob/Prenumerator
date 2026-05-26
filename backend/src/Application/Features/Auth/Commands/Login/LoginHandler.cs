using Application.Common.Interfaces;
using Application.Features.Auth.Dtos;
using Application.Features.Groups.Dtos;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands.Login;

public class LoginHandler(IUserRepository repo, IPasswordHasher hasher, IGroupRepository groupRepo)
    : IRequestHandler<LoginCommand, OperationResult<AuthResultDto>>
{
    public async Task<OperationResult<AuthResultDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await repo.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), ct);

        // Same error for all failure cases to prevent user enumeration.
        if (user is null || !hasher.Verify(request.Password, user.PasswordHash))
            return OperationResult<AuthResultDto>.Fail("INVALID_CREDENTIALS", "Invalid email or password.");

        if (!user.IsEmailVerified)
            return OperationResult<AuthResultDto>.Fail("EMAIL_NOT_VERIFIED", "Please verify your email before signing in.");

        var memberships = await groupRepo.GetMembershipsByUserIdAsync(user.Id.ToString(), ct);
        var groups = memberships
            .Select(m => new UserGroupDto(m.GroupId, m.MemberId, m.GroupName, m.IsCreator))
            .ToList();

        return new AuthResultDto(user.Id, user.Email, user.DisplayName, user.AvatarColor, user.PhoneNumber, groups);
    }
}
