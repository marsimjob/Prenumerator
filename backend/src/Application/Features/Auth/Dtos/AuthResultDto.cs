using Application.Features.Groups.Dtos;

namespace Application.Features.Auth.Dtos;

public record AuthResultDto(
    Guid UserId,
    string Username,
    string DisplayName,
    string AvatarColor,
    string? PhoneNumber,
    List<UserGroupDto> Groups);
