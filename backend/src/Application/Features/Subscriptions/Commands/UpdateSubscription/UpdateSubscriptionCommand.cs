using Domain.Common;
using Domain.Enums;
using MediatR;

namespace Application.Features.Subscriptions.Commands.UpdateSubscription;

public record UpdateSubscriptionCommand(
    Guid Id,
    string Name,
    string Color,
    WatchMode WatchMode,
    decimal Price,
    BillingCycle BillingCycle,
    Guid OwnerId
) : IRequest<OperationResult>;
