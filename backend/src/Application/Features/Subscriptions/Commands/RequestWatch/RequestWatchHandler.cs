using Application.Common.Interfaces;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Commands.RequestWatch;

public class RequestWatchHandler(ISubscriptionRepository repo, IFeedNotifier notifier)
    : IRequestHandler<RequestWatchCommand, OperationResult>
{
    public async Task<OperationResult> Handle(RequestWatchCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        if (sub.ActiveUser is null)
            return OperationResult.Fail("NO_ACTIVE_USER", "Ingen aktiv användare att skicka förfrågan till.");

        var requestorMember = sub.Members
            .FirstOrDefault(m => m.MemberId == request.RequestorMemberId)
            ?.Member;

        await notifier.NotifyMemberAsync(
            sub.ActiveUser.MemberId.ToString(),
            "watch_requested",
            new
            {
                subscriptionId   = sub.Id,
                subscriptionName = sub.Name,
                requestorMemberId = request.RequestorMemberId,
                requestorName    = requestorMember?.DisplayName ?? "Someone",
            },
            ct);

        return OperationResult.Ok();
    }
}
