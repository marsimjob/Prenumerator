using Application.Features.Subscriptions.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Subscriptions.Queries.GetSubscriptionById;

public record GetSubscriptionByIdQuery(Guid Id)
    : IRequest<OperationResult<SubscriptionDto>>;
