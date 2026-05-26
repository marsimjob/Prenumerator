using Application.Features.Auth.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Auth.Commands.VerifyEmail;

public record VerifyEmailCommand(string Email, string Code)
    : IRequest<OperationResult<AuthResultDto>>;
