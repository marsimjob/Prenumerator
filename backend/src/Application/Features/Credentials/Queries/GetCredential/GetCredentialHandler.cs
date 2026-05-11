using Application.Common.Interfaces;
using Application.Features.Credentials.Dtos;
using Domain.Common;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Credentials.Queries.GetCredential;

public class GetCredentialHandler(ISubscriptionRepository repo, IEncryptionService encryption)
    : IRequestHandler<GetCredentialQuery, OperationResult<CredentialDto>>
{
    public async Task<OperationResult<CredentialDto>> Handle(GetCredentialQuery request, CancellationToken ct)
    {
        var sub = await repo.GetWithCredentialAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult<CredentialDto>.NotFound("Prenumeration hittades inte.");

        if (sub.Credential is null)
            return OperationResult<CredentialDto>.NotFound("Inga inloggningsuppgifter sparade.");

        return new CredentialDto(
            sub.Id,
            encryption.Decrypt(sub.Credential.UsernameEncrypted),
            encryption.Decrypt(sub.Credential.PasswordEncrypted));
    }
}
