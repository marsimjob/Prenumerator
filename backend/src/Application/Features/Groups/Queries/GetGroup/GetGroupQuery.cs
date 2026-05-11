using Application.Features.Groups.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Groups.Queries.GetGroup;

public record GetGroupQuery(Guid GroupId) : IRequest<OperationResult<GroupDto>>;
