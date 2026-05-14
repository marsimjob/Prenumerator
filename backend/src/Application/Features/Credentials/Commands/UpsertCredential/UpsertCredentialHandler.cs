using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using MediatR;

namespace Application.Features.Credentials.Commands.UpsertCredential;

public class UpsertCredentialHandler(
    ISubscriptionRepository repo,
    IUnitOfWork uow,
    IEncryptionService encryption)
    : IRequestHandler<UpsertCredentialCommand, OperationResult>
{
    public async Task<OperationResult> Handle(UpsertCredentialCommand request, CancellationToken ct)
    {
        var sub = await repo.GetWithCredentialAsync(request.SubscriptionId, ct);

        if (sub is null)
            return OperationResult.NotFound("Prenumeration hittades inte.");

        var encUsername = encryption.Encrypt(request.Username);
        var encPassword = encryption.Encrypt(request.Password);

        if (sub.Credential is not null)
        {
            sub.Credential.UsernameEncrypted = encUsername;
            sub.Credential.PasswordEncrypted = encPassword;
        }
        else
        {
            await repo.AddCredentialAsync(new Credential
            {
                Id                  = Guid.NewGuid(),
                SubscriptionId      = sub.Id,
                UsernameEncrypted   = encUsername,
                PasswordEncrypted   = encPassword,
            }, ct);
        }

        await uow.SaveChangesAsync(ct);
        return OperationResult.Ok();
    }
}
