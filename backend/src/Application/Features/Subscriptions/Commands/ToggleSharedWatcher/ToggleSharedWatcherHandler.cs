using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.ToggleSharedWatcher;

public class ToggleSharedWatcherHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<ToggleSharedWatcherCommand, OperationResult>
{
    public async Task<OperationResult> Handle(ToggleSharedWatcherCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        var member = sub.Members.FirstOrDefault(m => m.MemberId == request.MemberId);

        if (member is null)
            return OperationResult.NotFound("Du är inte medlem i denna prenumeration.");

        member.IsActive = !member.IsActive;

        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            sub.GroupId.ToString(),
            "subscription_updated",
            new { id = sub.Id, groupId = sub.GroupId },
            ct);

        return OperationResult.Ok();
    }
}
