using Api.Hubs;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace Api.Services;

public class SignalRFeedNotifier(IHubContext<FeedHub> hub) : IFeedNotifier
{
    public Task NotifyGroupAsync(string groupId, string eventType, object payload, CancellationToken ct = default)
        => hub.Clients.Group(groupId).SendAsync(eventType, payload, cancellationToken: ct);

    public Task NotifyMemberAsync(string memberId, string eventType, object payload, CancellationToken ct = default)
        => hub.Clients.Group($"member:{memberId}").SendAsync(eventType, payload, cancellationToken: ct);
}
