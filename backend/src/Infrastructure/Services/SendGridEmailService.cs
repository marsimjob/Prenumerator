using Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Infrastructure.Services;

public class SendGridEmailService(IConfiguration configuration) : IEmailService
{
    private readonly string _apiKey  = configuration["SENDGRID_API_KEY"]  ?? Environment.GetEnvironmentVariable("SENDGRID_API_KEY")  ?? throw new InvalidOperationException("SENDGRID_API_KEY is not configured.");
    private readonly string _fromEmail = configuration["SENDGRID_FROM_EMAIL"] ?? Environment.GetEnvironmentVariable("SENDGRID_FROM_EMAIL") ?? "noreply@prenumerator.app";
    private readonly string _fromName  = "Prenumerator";

    public async Task SendVerificationCodeAsync(string toEmail, string code, CancellationToken ct = default)
    {
        var client  = new SendGridClient(_apiKey);
        var from    = new EmailAddress(_fromEmail, _fromName);
        var to      = new EmailAddress(toEmail);
        var subject = "Your Prenumerator verification code";
        var text    = $"Your verification code is: {code}\n\nIt expires in 24 hours.";
        var html    = $"<p>Your verification code is:</p><h2 style=\"letter-spacing:4px\">{code}</h2><p>It expires in 24 hours.</p>";
        var msg     = MailHelper.CreateSingleEmail(from, to, subject, text, html);
        await client.SendEmailAsync(msg, ct);
    }

    public async Task SendNewPasswordAsync(string toEmail, string newPassword, CancellationToken ct = default)
    {
        var client  = new SendGridClient(_apiKey);
        var from    = new EmailAddress(_fromEmail, _fromName);
        var to      = new EmailAddress(toEmail);
        var subject = "Your new Prenumerator password";
        var text    = $"Your new password is: {newPassword}\n\nYou can change it after signing in.";
        var html    = $"<p>Your new password is:</p><h2 style=\"font-family:monospace\">{newPassword}</h2><p>You can change it after signing in.</p>";
        var msg     = MailHelper.CreateSingleEmail(from, to, subject, text, html);
        await client.SendEmailAsync(msg, ct);
    }
}
