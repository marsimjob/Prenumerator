using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.ToggleSharedWatcher;

public record ToggleSharedWatcherCommand(Guid SubscriptionId, Guid MemberId)
    : IRequest<OperationResult>;
