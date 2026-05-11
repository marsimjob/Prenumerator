namespace Application.Features.Credentials.Dtos;

public record CredentialDto(Guid SubscriptionId, string Username, string Password);
