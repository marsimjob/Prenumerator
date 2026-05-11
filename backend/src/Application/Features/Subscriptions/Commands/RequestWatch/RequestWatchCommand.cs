using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.RequestWatch;

public record RequestWatchCommand(Guid SubscriptionId, Guid RequestorMemberId)
    : IRequest<OperationResult>;
