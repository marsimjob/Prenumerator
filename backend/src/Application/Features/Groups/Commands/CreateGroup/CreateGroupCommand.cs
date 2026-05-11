using Application.Features.Groups.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Groups.Commands.CreateGroup;

public record CreateGroupCommand(string Name, string UserId, string DisplayName, string? AvatarColor)
    : IRequest<OperationResult<CreateGroupResult>>;
