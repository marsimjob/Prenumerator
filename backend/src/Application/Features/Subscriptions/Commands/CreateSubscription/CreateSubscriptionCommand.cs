using Domain.Common;
using Domain.Enums;
using MediatR;


namespace Application.Features.Subscriptions.Commands.CreateSubscription;

public record CreateSubscriptionCommand(
    Guid GroupId,
    string Name,
    string Color,
    WatchMode WatchMode,
    decimal Price,
    BillingCycle BillingCycle,
    Guid OwnerId
) : IRequest<OperationResult<Guid>>;
