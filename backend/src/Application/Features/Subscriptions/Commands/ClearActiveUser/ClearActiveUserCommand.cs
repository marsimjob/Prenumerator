using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.ClearActiveUser;

public record ClearActiveUserCommand(Guid SubscriptionId, Guid MemberId)
    : IRequest<OperationResult>;
