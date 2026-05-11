using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.ResolveWatch;

public record ResolveWatchCommand(Guid SubscriptionId, Guid RequestorMemberId, bool Accepted)
    : IRequest<OperationResult>;
