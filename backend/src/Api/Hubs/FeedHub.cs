using Microsoft.AspNetCore.SignalR;

namespace Api.Hubs;

public class FeedHub : Hub
{
    public Task JoinGroup(string groupId)
        => Groups.AddToGroupAsync(Context.ConnectionId, groupId);

    public Task LeaveGroup(string groupId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId);

    public Task JoinMemberChannel(string memberId)
        => Groups.AddToGroupAsync(Context.ConnectionId, $"member:{memberId}");

    public Task LeaveMemberChannel(string memberId)
        => Groups.RemoveFromGroupAsync(Context.ConnectionId, $"member:{memberId}");
}
