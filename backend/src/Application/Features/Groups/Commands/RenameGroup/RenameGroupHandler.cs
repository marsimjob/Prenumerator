using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Groups.Commands.RenameGroup;

public class RenameGroupHandler(IGroupRepository repo, IUnitOfWork uow)
    : IRequestHandler<RenameGroupCommand, OperationResult>
{
    public async Task<OperationResult> Handle(RenameGroupCommand request, CancellationToken ct)
    {
        var group = await repo.GetByIdAsync(request.GroupId, ct);
        if (group is null)
            return OperationResult.NotFound("Grupp hittades inte.");

        // Allow rename if CreatorUserId is not set (legacy group) or matches the requester
        if (group.CreatorUserId != null && group.CreatorUserId != request.UserId)
            return OperationResult.Fail("FORBIDDEN", "Only the group creator can rename this group.");

        if (string.IsNullOrWhiteSpace(request.NewName) || request.NewName.Length > 100)
            return OperationResult.Fail("INVALID_NAME", "Group name must be between 1 and 100 characters.");

        group.Name = request.NewName.Trim();
        repo.Update(group);
        await uow.SaveChangesAsync(ct);

        return OperationResult.Ok();
    }
}
