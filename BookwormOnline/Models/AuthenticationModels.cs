namespace BookwormOnline.Models
{
    public class LoginModel
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }

    public class RegisterModel
    {
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string CreditCardNo { get; set; }
        public required string MobileNo { get; set; }
        public required string BillingAddress { get; set; }
        public required string ShippingAddress { get; set; }
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string ReCaptchaToken { get; set; }
        public IFormFile Photo { get; set; }
    }

    public class ChangePasswordModel
    {
        public required string CurrentPassword { get; set; }
        public required string NewPassword { get; set; }
    }

    public class ForgotPasswordModel
    {
        public required string Email { get; set; }
    }

    public class ResetPasswordModel
    {
        public required string ResetToken { get; set; }
        public required string NewPassword { get; set; }
    }

    public class TwoFactorModel
    {
        public required string Email { get; set; }
        public required string Code { get; set; }
    }
}