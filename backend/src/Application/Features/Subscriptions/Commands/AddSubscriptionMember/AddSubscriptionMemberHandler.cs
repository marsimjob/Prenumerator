using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.AddSubscriptionMember;

public class AddSubscriptionMemberHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IFeedNotifier notifier)
    : IRequestHandler<AddSubscriptionMemberCommand, OperationResult>
{
    public async Task<OperationResult> Handle(AddSubscriptionMemberCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        if (sub.Members.Any(m => m.MemberId == request.MemberId))
            return OperationResult.Ok(); // already a member — idempotent

        await repo.AddSubscriptionMemberAsync(new SubscriptionMember
        {
            SubscriptionId = request.SubscriptionId,
            MemberId       = request.MemberId,
        }, ct);

        await uow.SaveChangesAsync(ct);

        await notifier.NotifyGroupAsync(
            sub.GroupId.ToString(),
            "member_joined",
            new { id = sub.Id, groupId = sub.GroupId, name = sub.Name, actorId = request.MemberId },
            ct);

        return OperationResult.Ok();
    }
}
