using System.ComponentModel.DataAnnotations;

namespace BookwormOnline.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(50)]
        public string LastName { get; set; }

        [Required]
        [StringLength(200)]
        public string CreditCardNo { get; set; }

        [Required]
        [StringLength(20)]
        public string MobileNo { get; set; }

        [Required]
        [StringLength(200)]
        public string BillingAddress { get; set; }

        [Required]
        public string ShippingAddress { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }

        public string PhotoPath { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int LoginAttempts { get; set; }
        public DateTime? LockoutEnd { get; set; }
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        public List<string> PreviousPasswords { get; set; } = new List<string>();
        public DateTime? LastPasswordChangeDate { get; set; }
        public string? TwoFactorCode { get; set; }
        public DateTime? TwoFactorCodeExpiry { get; set; }
    }
}