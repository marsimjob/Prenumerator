namespace Application.Common.Interfaces;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string toEmail, string code, CancellationToken ct = default);
    Task SendNewPasswordAsync(string toEmail, string newPassword, CancellationToken ct = default);
}
