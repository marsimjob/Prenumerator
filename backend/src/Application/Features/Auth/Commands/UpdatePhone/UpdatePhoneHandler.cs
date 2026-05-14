using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Auth.Commands.UpdatePhone;

public class UpdatePhoneHandler(IUserRepository repo, IUnitOfWork uow)
    : IRequestHandler<UpdatePhoneCommand, OperationResult<bool>>
{
    public async Task<OperationResult<bool>> Handle(UpdatePhoneCommand request, CancellationToken ct)
    {
        var user = await repo.GetByIdAsync(request.UserId, ct);
        if (user is null)
            return OperationResult<bool>.NotFound("User not found.");

        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim();
        repo.Update(user);
        await uow.SaveChangesAsync(ct);

        return OperationResult<bool>.Ok(true);
    }
}
