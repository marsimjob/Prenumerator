using Application.Features.Credentials.Commands.UpsertCredential;
using Application.Features.Credentials.Queries.GetCredential;
using MediatR;

namespace Api.Endpoints.Credentials;

public static class CredentialEndpoints
{
    public static void MapCredentialEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/subscriptions/{id:guid}/credential")
            .WithTags("Credentials");

        group.MapGet("/",  GetCredential);
        group.MapPut("/",  UpsertCredential);
    }

    // GET /api/subscriptions/{id}/credential
    private static async Task<IResult> GetCredential(Guid id, ISender sender, CancellationToken ct)
    {
        var result = await sender.Send(new GetCredentialQuery(id), ct);
        return result.IsSuccess
            ? Results.Ok(result.Value)
            : Results.NotFound(result.Error);
    }

    // PUT /api/subscriptions/{id}/credential
    private static async Task<IResult> UpsertCredential(
        Guid id,
        UpsertCredentialRequest req,
        ISender sender,
        CancellationToken ct)
    {
        var result = await sender.Send(new UpsertCredentialCommand(id, req.Username, req.Password), ct);
        return result.IsSuccess
            ? Results.NoContent()
            : Results.NotFound(result.Error);
    }
}

public record UpsertCredentialRequest(string Username, string Password);
