using Domain.Common;
using MediatR;

namespace Application.Features.Groups.Commands.RenameGroup;

public record RenameGroupCommand(Guid GroupId, string UserId, string NewName)
    : IRequest<OperationResult>;
