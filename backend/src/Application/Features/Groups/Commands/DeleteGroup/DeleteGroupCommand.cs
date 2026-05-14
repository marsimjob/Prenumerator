using Domain.Common;
using MediatR;

namespace Application.Features.Groups.Commands.DeleteGroup;

public record DeleteGroupCommand(Guid GroupId, string UserId)
    : IRequest<OperationResult>;
