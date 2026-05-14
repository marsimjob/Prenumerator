using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.DeleteSubscription;

public class DeleteSubscriptionHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<DeleteSubscriptionCommand, OperationResult>
{
    public async Task<OperationResult> Handle(DeleteSubscriptionCommand request, CancellationToken ct)
    {
        var sub = await repo.GetByIdAsync(request.Id, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        var groupId = sub.GroupId;

        repo.Delete(sub);
        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            groupId.ToString(),
            "subscription_deleted",
            new { id = request.Id, groupId, name = sub.Name, actorId = sub.OwnerId },
            ct);

        return OperationResult.Ok();
    }
}
