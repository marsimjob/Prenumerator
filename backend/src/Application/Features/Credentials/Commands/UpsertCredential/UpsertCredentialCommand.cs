using Domain.Common;
using MediatR;

namespace Application.Features.Credentials.Commands.UpsertCredential;

public record UpsertCredentialCommand(Guid SubscriptionId, string Username, string Password)
    : IRequest<OperationResult>;
