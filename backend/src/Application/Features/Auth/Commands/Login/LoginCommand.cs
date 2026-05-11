using Application.Features.Auth.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Auth.Commands.Login;

public record LoginCommand(string Username, string Password)
    : IRequest<OperationResult<AuthResultDto>>;
