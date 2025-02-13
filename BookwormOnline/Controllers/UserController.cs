using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BookwormOnline.Data;
using BookwormOnline.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using BookwormOnline.Services;
using Ganss.Xss;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace BookwormOnline.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ReCaptchaService _reCaptchaService;
        private readonly HtmlSanitizer _sanitizer = new HtmlSanitizer();
        private readonly IWebHostEnvironment _environment;
        private readonly IEmailService _emailService;
        private readonly AuditService _auditService;
        private readonly EncryptionService _encryptionService;
        private readonly TwoFactorService _twoFactorService;

        public UserController(ApplicationDbContext context, IConfiguration configuration, ReCaptchaService reCaptchaService, IWebHostEnvironment environment, IEmailService emailService, AuditService auditService, EncryptionService encryptionService, TwoFactorService twoFactorService)
        {
            _context = context;
            _configuration = configuration;
            _reCaptchaService = reCaptchaService;
            _environment = environment;
            _emailService = emailService;
            _auditService = auditService;
            _encryptionService = encryptionService;
            _twoFactorService = twoFactorService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                Console.WriteLine("ModelState is not valid");
                return BadRequest(ModelState);
            }

            // Verify reCAPTCHA token
            var isReCaptchaValid = await _reCaptchaService.VerifyToken(model.ReCaptchaToken);
            Console.WriteLine($"ReCaptcha verification result: {isReCaptchaValid}");
            if (!isReCaptchaValid)
            {
                Console.WriteLine("reCAPTCHA verification failed");
                return BadRequest(new { error = "reCAPTCHA verification failed" });
            }

            // Check for duplicate email
            if (await _context.Users.AnyAsync(u => u.Email == model.Email))
            {
                Console.WriteLine("Email already exists");
                return BadRequest(new { error = "Email already exists" });
            }

            // Validate password complexity
            if (!IsPasswordStrong(model.Password))
            {
                Console.WriteLine("Password does not meet complexity requirements");
                return BadRequest(new { error = "Password does not meet complexity requirements. Needs to be at least 12 characters long and contains at least 1 lowercase letter, 1 uppercase letter, 1 digit, and 1 special character" });
            }

            // Sanitize input
            model.FirstName = _sanitizer.Sanitize(model.FirstName);
            model.LastName = _sanitizer.Sanitize(model.LastName);
            model.BillingAddress = _sanitizer.Sanitize(model.BillingAddress);
            model.ShippingAddress = _sanitizer.Sanitize(model.ShippingAddress);

            // Validate credit card number
            if (!IsValidCreditCardNumber(model.CreditCardNo))
            {
                Console.WriteLine("Invalid credit card number");
                return BadRequest(new { error = "Invalid credit card number" });
            }            
            
            // Validate mobile number format
            if (!IsValidMobileNumber(model.MobileNo))
            {
                Console.WriteLine("Invalid mobile number format");
                return BadRequest(new { error = "Invalid mobile number format" });
            }

            // Validate email format
            if (!IsValidEmail(model.Email))
            {
                Console.WriteLine("Invalid email format");
                return BadRequest(new { error = "Invalid email format" });
            }

            // Handle file upload for profile picture
            string photoPath = "";
            if (model.Photo != null)
            {
                if (!model.Photo.ContentType.StartsWith("image/jpeg"))
                {
                    return BadRequest("Only JPG files are allowed");
                }
                try
                {
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }


                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(model.Photo.FileName);
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await model.Photo.CopyToAsync(stream);
                    }


                photoPath = fileName;                
                }
                catch (Exception ex) {
                    Console.WriteLine($"Error uploading file: {ex.Message}");
                    Console.WriteLine($"_environment.WebRootPath: {_environment.WebRootPath}");
                    return BadRequest(new { error = "Error uploading file" });
                }
            }

            var user = new User
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                CreditCardNo = EncryptData(model.CreditCardNo),
                MobileNo = model.MobileNo,
                BillingAddress = model.BillingAddress,
                ShippingAddress = model.ShippingAddress,
                Email = model.Email,
                PasswordHash = HashPassword(model.Password),
                CreatedAt = DateTime.UtcNow,
                LastPasswordChangeDate = DateTime.UtcNow,
                PhotoPath = photoPath
            };

            _context.Users.Add(user);
            user.PreviousPasswords.Add(user.PasswordHash);
            await _context.SaveChangesAsync();

            return Ok("User registered successfully");
        }

        private bool IsValidCreditCardNumber(string creditCardNo)
        {
            return Regex.IsMatch(creditCardNo, @"^\d{13,19}$");
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private bool IsValidMobileNumber(string mobileNo)
        {
            return Regex.IsMatch(mobileNo, @"^\d{8,8}$");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

                if (user == null)
                {
                    Console.WriteLine("Login attempt failed: User not found");
                    return Unauthorized(new { error = "Invalid email or password" });
                }

                if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
                {
                    Console.WriteLine("Login attempt failed: Account is locked");
                    return Unauthorized(new { error = "Account is locked. Please try again later." });
                }

                if (!VerifyPassword(model.Password, user.PasswordHash))
                {
                    user.LoginAttempts++;
                    if (user.LoginAttempts >= 3)
                    {
                        user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                    }
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Login attempt failed: Invalid password (Attempts: {user.LoginAttempts})");
                    return Unauthorized(new { error = "Invalid email or password" });
                }

                user.LoginAttempts = 0;
                user.LastLoginAt = DateTime.UtcNow;

                // Generate and send 2FA code
                await _twoFactorService.GenerateAndSendCodeAsync(user);

                await _context.SaveChangesAsync();

                var token = GenerateJwtToken(user);
                Console.WriteLine($"Login successful for user: {user.Email}");

                return Ok(new { requiresTwoFactor = true });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, "An error occurred during login");
            }
        }

        [HttpPost("verify-2fa")]
        public async Task<IActionResult> VerifyTwoFactor([FromBody] TwoFactorModel model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || user.TwoFactorCodeExpiry < DateTime.UtcNow)
            {
                return BadRequest(new { error = "Invalid or expired code" });
            }

            if (user.TwoFactorCode == null || !_twoFactorService.VerifyCode(user.TwoFactorCode, model.Code))
            {
                return BadRequest(new { error = "Invalid code" });
            }

            // Clear 2FA code
            user.TwoFactorCode = null;
            user.TwoFactorCodeExpiry = null;
            await _context.SaveChangesAsync();

            // Generate JWT token and complete login
            var token = GenerateJwtToken(user);
            return Ok(new { token });
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return Ok("Logged out successfully");
        }

        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                    throw new InvalidOperationException("User ID not found in token"));

                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return NotFound(new { error = "User not found" });
                }


                // Decrypt sensitive data
                user.CreditCardNo = DecryptData(user.CreditCardNo);

                return Ok(new
                {
                    user.Id,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.MobileNo,
                    user.CreditCardNo,
                    user.BillingAddress,
                    user.ShippingAddress,
                    user.PhotoPath
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetProfile: {ex.Message}");
                return StatusCode(500, "An error occurred while fetching the profile");
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                throw new InvalidOperationException("User ID not found in token"));

            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            if (!VerifyPassword(model.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { error = "Current password is incorrect" });
            }

            if (!IsPasswordStrong(model.NewPassword))
            {
                return BadRequest(new { error = "New password does not meet complexity requirements. Needs to be at least 12 characters long and contains at least 1 lowercase letter, 1 uppercase letter, 1 digit, and 1 special character" });
            }

            // Check password history
            if (user.PreviousPasswords.Any(p => VerifyPassword(model.NewPassword, p)))
            {
                return BadRequest(new { error = "New password must be different from the last 2 passwords" });
            }

            // Check minimum password age
            if (user.LastPasswordChangeDate.HasValue && user.LastPasswordChangeDate.Value.AddMinutes(5) > DateTime.UtcNow)
            {
                return BadRequest(new { error = "You cannot change your password more than once every 5 minutes" });
            }

            // Update password
            user.PasswordHash = HashPassword(model.NewPassword);
            user.LastPasswordChangeDate = DateTime.UtcNow;

            // Update password history
            user.PreviousPasswords.Add(user.PasswordHash);
            if (user.PreviousPasswords.Count > 2)
            {
                user.PreviousPasswords.RemoveAt(0);
            }

            await _context.SaveChangesAsync();

            return Ok("Password changed successfully");
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
                return Ok("If your email is registered, you will receive a reset link");

            var token = Guid.NewGuid().ToString();
            user.PasswordResetToken = token;
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(5);
            await _context.SaveChangesAsync();

            // Use the frontend URL from configuration
            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
            var resetLink = $"{frontendUrl}/reset-password?token={token}";

            await _emailService.SendEmailAsync(
                model.Email,
                "Password Reset Request",
                $@"
                <html>
                    <body>
                        <h2>Password Reset Request</h2>
                        <p>You requested to reset your password. Click the link below to proceed:</p>
                        <p><a href='{resetLink}'>{resetLink}</a></p>
                        <p>This link will expire in 5 minutes.</p>
                        <p>If you did not request this password reset, please ignore this email.</p>
                    </body>
                </html>"
            );

            await _auditService.LogAction(user.Id, "PasswordReset", "Password reset requested");

            return Ok("If your email is registered, you will receive a reset link");
        }

        private readonly Dictionary<int, HashSet<string>> _userSessions = new();

        [Authorize]
        [HttpPost("verify-session")]
        public IActionResult VerifySession()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                throw new InvalidOperationException("User ID not found in token"));
            var sessionId = HttpContext.Session.Id;

            lock (_userSessions)
            {
                if (!_userSessions.ContainsKey(userId))
                {
                    _userSessions[userId] = new HashSet<string>();
                }

                if (_userSessions[userId].Count > 0 && !_userSessions[userId].Contains(sessionId))
                {
                    return Conflict(new { error = "Another session is active. Logout from the other session to login here." });
                }

                _userSessions[userId].Add(sessionId);
            }

            return Ok();
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordModel model)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == model.ResetToken);

            if (user == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            {
                return BadRequest(new { error = "Invalid or expired reset token" });
            }

            if (!IsPasswordStrong(model.NewPassword))
            {
                return BadRequest(new { error = "New password does not meet complexity requirements. Needs to be at least 12 characters long and contains at least 1 lowercase letter, 1 uppercase letter, 1 digit, and 1 special character" });
            }

            // Update password
            user.PasswordHash = HashPassword(model.NewPassword);
            user.PasswordResetToken = null;
            user.PasswordResetTokenExpiry = null;
            user.LastPasswordChangeDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok("Password reset successfully");
        }

        private bool IsPasswordStrong(string password)
        {
            return password.Length >= 12 &&
                   Regex.IsMatch(password, @"[a-z]") &&
                   Regex.IsMatch(password, @"[A-Z]") &&
                   Regex.IsMatch(password, @"[0-9]") &&
                   Regex.IsMatch(password, @"[@$!%*?&]") &&
                   Regex.IsMatch(password, @"[^a-zA-Z0-9]");
        }

        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        private bool VerifyPassword(string password, string hashedPassword)
        {
            return BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        }

        private string EncryptData(string data)
        {
            return _encryptionService.EncryptAES(data);
        }

        private string DecryptData(string encryptedData)
        {
            return _encryptionService.DecryptAES(encryptedData);
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                throw new InvalidOperationException("JWT key is not configured.");
            }
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}