using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.RemoveSubscriptionMember;

public class RemoveSubscriptionMemberHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<RemoveSubscriptionMemberCommand, OperationResult>
{
    public async Task<OperationResult> Handle(RemoveSubscriptionMemberCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        var membership = sub.Members.FirstOrDefault(m => m.MemberId == request.MemberId);
        if (membership is null)
            return OperationResult.Ok(); // not a member — idempotent

        // If they hold the active slot, release it first
        if (sub.ActiveUser?.MemberId == request.MemberId)
            await repo.RemoveActiveUserAsync(sub.ActiveUser, ct);

        await repo.RemoveSubscriptionMemberAsync(membership, ct);
        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            sub.GroupId.ToString(),
            "member_left",
            new { id = sub.Id, groupId = sub.GroupId, name = sub.Name, actorId = request.MemberId },
            ct);

        return OperationResult.Ok();
    }
}
