using Application.Features.Auth.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Auth.Commands.Register;

public record RegisterCommand(string Username, string Password, string DisplayName, string AvatarColor, string? PhoneNumber)
    : IRequest<OperationResult<AuthResultDto>>;
