using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.SetActiveUser;

public class SetActiveUserHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<SetActiveUserCommand, OperationResult>
{
    public async Task<OperationResult> Handle(SetActiveUserCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        if (sub.ActiveUser is not null)
        {
            sub.ActiveUser.MemberId  = request.MemberId;
            sub.ActiveUser.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            await repo.AddActiveUserAsync(new ActiveUser
            {
                Id             = Guid.NewGuid(),
                SubscriptionId = request.SubscriptionId,
                MemberId       = request.MemberId,
                UpdatedAt      = DateTime.UtcNow,
            }, ct);
        }
        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            sub.GroupId.ToString(),
            "watcher_changed",
            new { id = sub.Id, groupId = sub.GroupId, name = sub.Name, actorId = request.MemberId },
            ct);

        return OperationResult.Ok();
    }
}
