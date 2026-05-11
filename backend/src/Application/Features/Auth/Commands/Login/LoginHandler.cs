using Application.Common.Interfaces;
using Application.Features.Auth.Dtos;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands.Login;

public class LoginHandler(IUserRepository repo, IPasswordHasher hasher)
    : IRequestHandler<LoginCommand, OperationResult<AuthResultDto>>
{
    public async Task<OperationResult<AuthResultDto>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await repo.GetByUsernameAsync(request.Username.Trim().ToLowerInvariant(), ct);

        // Use the same error for wrong username and wrong password to avoid user enumeration.
        if (user is null || !hasher.Verify(request.Password, user.PasswordHash))
            return OperationResult<AuthResultDto>.Fail("INVALID_CREDENTIALS", "Invalid username or password.");

        return new AuthResultDto(user.Id, user.Username, user.DisplayName, user.AvatarColor);
    }
}
