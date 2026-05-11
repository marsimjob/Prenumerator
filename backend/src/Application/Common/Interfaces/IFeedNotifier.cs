namespace Application.Common.Interfaces;

public interface IFeedNotifier
{
    Task NotifyGroupAsync(string groupId, string eventType, object payload, CancellationToken ct = default);
    Task NotifyMemberAsync(string memberId, string eventType, object payload, CancellationToken ct = default);
}
