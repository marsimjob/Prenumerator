using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.ClearActiveUser;

public class ClearActiveUserHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<ClearActiveUserCommand, OperationResult>
{
    public async Task<OperationResult> Handle(ClearActiveUserCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        if (sub.ActiveUser is null || sub.ActiveUser.MemberId != request.MemberId)
            return OperationResult.Ok();

        await repo.RemoveActiveUserAsync(sub.ActiveUser, ct);
        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            sub.GroupId.ToString(),
            "watcher_cleared",
            new { id = sub.Id, groupId = sub.GroupId, name = sub.Name, actorId = request.MemberId },
            ct);

        return OperationResult.Ok();
    }
}
