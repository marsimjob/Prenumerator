using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Groups.Commands.DeleteGroup;

public class DeleteGroupHandler(IGroupRepository repo, IUnitOfWork uow)
    : IRequestHandler<DeleteGroupCommand, OperationResult>
{
    public async Task<OperationResult> Handle(DeleteGroupCommand request, CancellationToken ct)
    {
        var group = await repo.GetByIdAsync(request.GroupId, ct);
        if (group is null)
            return OperationResult.NotFound("Grupp hittades inte.");

        if (group.CreatorUserId != null && group.CreatorUserId != request.UserId)
            return OperationResult.Fail("FORBIDDEN", "Only the group creator can delete this group.");

        repo.Delete(group);
        await uow.SaveChangesAsync(ct);

        return OperationResult.Ok();
    }
}
