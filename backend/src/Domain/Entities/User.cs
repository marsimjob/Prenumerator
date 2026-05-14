using Domain.Common;

namespace Domain.Entities;

public class User : Entity
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = "#6366f1";
    public string? PhoneNumber { get; set; }
}
