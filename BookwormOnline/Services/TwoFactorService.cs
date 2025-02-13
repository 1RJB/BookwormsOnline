using BookwormOnline.Data;
using BookwormOnline.Models;
using System.Text;
using System.Security.Cryptography;

namespace BookwormOnline.Services
{
    public class TwoFactorService
    {
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public TwoFactorService(IEmailService emailService, ApplicationDbContext context, IConfiguration configuration)
        {
            _emailService = emailService;
            _context = context;
            _configuration = configuration;
        }

        public async Task<string> GenerateAndSendCodeAsync(User user)
        {
            // Generate a 6-digit code
            var code = GenerateCode();

            // Hash the code before storing
            var hashedCode = HashCode(code);

            // Store in user record with 5-minute expiry
            user.TwoFactorCode = hashedCode;
            user.TwoFactorCodeExpiry = DateTime.UtcNow.AddMinutes(5);
            await _context.SaveChangesAsync();

            // Send via email
            await _emailService.SendEmailAsync(
                user.Email,
                "Your Two-Factor Authentication Code",
                $@"
            <html>
                <body>
                    <h2>Two-Factor Authentication Code</h2>
                    <p>Your verification code is: <strong>{code}</strong></p>
                    <p>This code will expire in 5 minutes.</p>
                    <p>If you did not request this code, please secure your account immediately.</p>
                </body>
            </html>");

            return hashedCode;
        }

        public bool VerifyCode(string storedHash, string submittedCode)
        {
            var submittedHash = HashCode(submittedCode);
            return storedHash == submittedHash;
        }

        private string GenerateCode()
        {
            return Random.Shared.Next(100000, 999999).ToString("D6");
        }

        private string HashCode(string code)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(code));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}
