using Application.Features.Subscriptions.Dtos;
using Domain.Common;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Subscriptions.Queries.GetSubscriptionById;

public class GetSubscriptionByIdHandler(ISubscriptionRepository repo, IUserRepository userRepo)
    : IRequestHandler<GetSubscriptionByIdQuery, OperationResult<SubscriptionDto>>
{
    public async Task<OperationResult<SubscriptionDto>> Handle(
        GetSubscriptionByIdQuery request, CancellationToken ct)
    {
        var sub = await repo.GetWithDetailsAsync(request.Id, ct);

        if (sub is null)
            return OperationResult<SubscriptionDto>.NotFound("Prenumeration hittades inte.");

        string? ownerPhone = null;
        if (sub.Owner?.UserId is { } ownerUserId)
        {
            var users = await userRepo.GetByStringIdsAsync([ownerUserId], ct);
            ownerPhone = users.FirstOrDefault()?.PhoneNumber;
        }

        var dto = new SubscriptionDto(
            Id:               sub.Id,
            GroupId:          sub.GroupId,
            Name:             sub.Name,
            Color:            sub.Color,
            WatchMode:        sub.WatchMode.ToString(),
            Price:            sub.Price,
            BillingCycle:     sub.BillingCycle.ToString(),
            OwnerId:          sub.OwnerId,
            OwnerDisplayName: sub.Owner?.DisplayName ?? string.Empty,
            OwnerAvatarColor: sub.Owner?.AvatarColor ?? "#6366f1",
            OwnerSwishNumber: ownerPhone,
            Members:          sub.Members.Select(m => new SubscriptionMemberDto(
                                  m.MemberId,
                                  m.Member?.DisplayName ?? string.Empty,
                                  m.Member?.AvatarColor ?? "#6366f1")).ToList(),
            ActiveMemberIds:  sub.WatchMode == WatchMode.Exclusive
                                  ? (sub.ActiveUser != null ? [sub.ActiveUser.MemberId] : [])
                                  : sub.Members.Where(m => m.IsActive).Select(m => m.MemberId).ToList(),
            CreatedAt:        sub.CreatedAt,
            UpdatedAt:        sub.UpdatedAt
        );

        return OperationResult<SubscriptionDto>.Ok(dto);
    }
}
