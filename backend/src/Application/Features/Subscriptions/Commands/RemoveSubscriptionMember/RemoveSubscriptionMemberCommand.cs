using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Commands.RemoveSubscriptionMember;

public record RemoveSubscriptionMemberCommand(Guid SubscriptionId, Guid MemberId)
    : IRequest<OperationResult>;
