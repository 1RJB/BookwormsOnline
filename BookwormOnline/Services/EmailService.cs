using System.Net.Mail;
using System.Net;

namespace BookwormOnline.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            using var client = new SmtpClient(_configuration["Email:SmtpHost"], int.Parse(_configuration["Email:SmtpPort"]))
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(_configuration["Email:Username"], _configuration["Email:Password"])
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_configuration["Email:FromAddress"]),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
        }
    }
}