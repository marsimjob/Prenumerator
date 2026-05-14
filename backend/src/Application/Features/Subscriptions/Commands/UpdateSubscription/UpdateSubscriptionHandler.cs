using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.UpdateSubscription;

public class UpdateSubscriptionHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<UpdateSubscriptionCommand, OperationResult>
{
    public async Task<OperationResult> Handle(UpdateSubscriptionCommand request, CancellationToken ct)
    {
        var sub = await repo.GetByIdAsync(request.Id, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        sub.Name         = request.Name;
        sub.Color        = request.Color;
        sub.WatchMode    = request.WatchMode;
        sub.Price        = request.Price;
        sub.BillingCycle = request.BillingCycle;
        sub.OwnerId      = request.OwnerId;

        repo.Update(sub);
        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            sub.GroupId.ToString(),
            "subscription_updated",
            new { id = sub.Id, groupId = sub.GroupId, name = sub.Name },
            ct);

        return OperationResult.Ok();
    }
}
