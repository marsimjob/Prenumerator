using Application.Common.Interfaces;
using Application.Features.Auth.Dtos;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands.Register;

public class RegisterHandler(IUserRepository repo, IUnitOfWork uow, IPasswordHasher hasher)
    : IRequestHandler<RegisterCommand, OperationResult<AuthResultDto>>
{
    public async Task<OperationResult<AuthResultDto>> Handle(RegisterCommand request, CancellationToken ct)
    {
        if (await repo.UsernameExistsAsync(request.Username, ct))
            return OperationResult<AuthResultDto>.Fail("USERNAME_TAKEN", "That username is already taken.");

        var user = new User
        {
            Id           = Guid.NewGuid(),
            Username     = request.Username.Trim().ToLowerInvariant(),
            PasswordHash = hasher.Hash(request.Password),
            DisplayName  = request.DisplayName.Trim(),
            AvatarColor  = request.AvatarColor,
            PhoneNumber  = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
        };

        await repo.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        return new AuthResultDto(user.Id, user.Username, user.DisplayName, user.AvatarColor, null, []);
    }
}
