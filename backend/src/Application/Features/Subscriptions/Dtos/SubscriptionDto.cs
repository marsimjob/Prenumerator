namespace Application.Features.Subscriptions.Dtos;

public record SubscriptionDto(
    Guid Id,
    Guid GroupId,
    string Name,
    string Color,
    string WatchMode,
    decimal Price,
    string BillingCycle,
    Guid OwnerId,
    string OwnerDisplayName,
    string OwnerAvatarColor,
    string? OwnerSwishNumber,
    List<SubscriptionMemberDto> Members,
    List<Guid> ActiveMemberIds,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record SubscriptionMemberDto(
    Guid MemberId,
    string DisplayName,
    string AvatarColor
);
