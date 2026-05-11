namespace Application.Features.Auth.Dtos;

public record AuthResultDto(Guid UserId, string Username, string DisplayName, string AvatarColor);
