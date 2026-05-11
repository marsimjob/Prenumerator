using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.AddSubscriptionMember;

public record AddSubscriptionMemberCommand(Guid SubscriptionId, Guid MemberId)
    : IRequest<OperationResult>;
