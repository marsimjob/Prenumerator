using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.SetActiveUser;

public record SetActiveUserCommand(Guid SubscriptionId, Guid MemberId)
    : IRequest<OperationResult>;
