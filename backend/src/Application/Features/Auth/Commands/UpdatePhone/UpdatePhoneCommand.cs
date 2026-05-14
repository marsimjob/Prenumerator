using Domain.Common;
using MediatR;

namespace Application.Features.Auth.Commands.UpdatePhone;

public record UpdatePhoneCommand(Guid UserId, string? PhoneNumber)
    : IRequest<OperationResult<bool>>;
