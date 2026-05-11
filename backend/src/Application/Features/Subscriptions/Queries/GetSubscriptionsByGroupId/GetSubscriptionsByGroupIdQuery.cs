using Application.Features.Subscriptions.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Queries.GetSubscriptionsByGroupId;

public record GetSubscriptionsByGroupIdQuery(Guid GroupId)
    : IRequest<OperationResult<IReadOnlyList<SubscriptionDto>>>;
