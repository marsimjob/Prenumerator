using Application.Features.Groups.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Groups.Commands.JoinGroup;

public record JoinGroupCommand(string InviteCode, string UserId, string DisplayName, string? AvatarColor)
    : IRequest<OperationResult<JoinGroupResult>>;
