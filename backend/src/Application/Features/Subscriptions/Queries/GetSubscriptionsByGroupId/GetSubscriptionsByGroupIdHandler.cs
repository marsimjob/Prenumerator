using Application.Features.Subscriptions.Dtos;
using Domain.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Queries.GetSubscriptionsByGroupId;

public class GetSubscriptionsByGroupIdHandler(ISubscriptionRepository repo)
    : IRequestHandler<GetSubscriptionsByGroupIdQuery, OperationResult<IReadOnlyList<SubscriptionDto>>>
{
    public async Task<OperationResult<IReadOnlyList<SubscriptionDto>>> Handle(
        GetSubscriptionsByGroupIdQuery request, CancellationToken ct)
    {
        var subs = await repo.GetByGroupIdAsync(request.GroupId, ct);

        var dtos = subs.Select(s => new SubscriptionDto(
            Id:               s.Id,
            GroupId:          s.GroupId,
            Name:             s.Name,
            Color:            s.Color,
            WatchMode:        s.WatchMode.ToString(),
            Price:            s.Price,
            BillingCycle:     s.BillingCycle.ToString(),
            OwnerId:          s.OwnerId,
            OwnerDisplayName: s.Owner?.DisplayName ?? string.Empty,
            OwnerAvatarColor: s.Owner?.AvatarColor ?? "#6366f1",
            Members:          s.Members.Select(m => new SubscriptionMemberDto(
                                  m.MemberId,
                                  m.Member?.DisplayName ?? string.Empty,
                                  m.Member?.AvatarColor ?? "#6366f1")).ToList(),
            ActiveMemberIds:  s.WatchMode == WatchMode.Exclusive
                                  ? (s.ActiveUser != null ? [s.ActiveUser.MemberId] : [])
                                  : s.Members.Where(m => m.IsActive).Select(m => m.MemberId).ToList(),
            CreatedAt:        s.CreatedAt,
            UpdatedAt:        s.UpdatedAt
        )).ToList();

        return OperationResult<IReadOnlyList<SubscriptionDto>>.Ok(dtos);
    }
}
