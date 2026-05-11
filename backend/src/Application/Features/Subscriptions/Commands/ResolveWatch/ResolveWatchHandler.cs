using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.ResolveWatch;

public class ResolveWatchHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<ResolveWatchCommand, OperationResult>
{
    public async Task<OperationResult> Handle(ResolveWatchCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        var payload = new { subscriptionId = sub.Id, subscriptionName = sub.Name };

        if (!request.Accepted)
        {
            await notifier.NotifyMemberAsync(
                request.RequestorMemberId.ToString(), "watch_declined", payload, ct);
            return OperationResult.Ok();
        }

        // Accept: transfer the active user slot to the requestor.
        if (sub.ActiveUser is not null)
        {
            sub.ActiveUser.MemberId  = request.RequestorMemberId;
            sub.ActiveUser.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            sub.ActiveUser = new ActiveUser
            {
                Id             = Guid.NewGuid(),
                SubscriptionId = sub.Id,
                MemberId       = request.RequestorMemberId,
                UpdatedAt      = DateTime.UtcNow,
            };
        }
        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            sub.GroupId.ToString(),
            "subscription_updated",
            new { id = sub.Id, groupId = sub.GroupId },
            ct);

        await notifier.NotifyMemberAsync(
            request.RequestorMemberId.ToString(), "watch_accepted", payload, ct);

        return OperationResult.Ok();
    }
}
