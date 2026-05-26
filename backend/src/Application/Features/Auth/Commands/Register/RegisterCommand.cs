using Domain.Common;
using MediatR;

namespace Application.Features.Auth.Commands.Register;

public record RegisterCommand(string Email, string Password, string DisplayName, string AvatarColor, string? PhoneNumber)
    : IRequest<OperationResult<string>>;
