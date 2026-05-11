using Application.Features.Credentials.Dtos;
using Domain.Common;
using MediatR;

namespace Application.Features.Credentials.Queries.GetCredential;

public record GetCredentialQuery(Guid SubscriptionId) : IRequest<OperationResult<CredentialDto>>;
