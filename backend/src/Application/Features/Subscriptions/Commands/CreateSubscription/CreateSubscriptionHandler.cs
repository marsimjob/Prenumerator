using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.CreateSubscription;

public class CreateSubscriptionHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<CreateSubscriptionCommand, OperationResult<Guid>>
{
    public async Task<OperationResult<Guid>> Handle(CreateSubscriptionCommand request, CancellationToken ct)
    {
        var subscription = new Subscription
        {
            Id           = Guid.NewGuid(),
            GroupId      = request.GroupId,
            Name         = request.Name,
            Color        = request.Color,
            WatchMode    = request.WatchMode,
            Price        = request.Price,
            BillingCycle = request.BillingCycle,
            OwnerId      = request.OwnerId,
        };

        // Owner is automatically the first member of the subscription.
        subscription.Members.Add(new SubscriptionMember
        {
            SubscriptionId = subscription.Id,
            MemberId       = request.OwnerId,
        });

        await repo.AddAsync(subscription, ct);
        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            request.GroupId.ToString(),
            "subscription_created",
            new { id = subscription.Id, groupId = request.GroupId, name = subscription.Name, actorId = request.OwnerId },
            ct);

        return OperationResult<Guid>.Ok(subscription.Id);
    }
}
