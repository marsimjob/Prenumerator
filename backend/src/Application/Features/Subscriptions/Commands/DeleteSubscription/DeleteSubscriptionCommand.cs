using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.DeleteSubscription;

public record DeleteSubscriptionCommand(Guid Id) : IRequest<OperationResult>;
