using System.Security.Cryptography;
using System.Text;

namespace BookwormOnline.Services
{
    public class EncryptionService
    {
        private readonly string _key;
        private readonly string _iv;

        public EncryptionService(IConfiguration configuration)
        {
            _key = configuration["Encryption:Key"] ?? throw new ArgumentNullException("Encryption:Key not configured");
            _iv = configuration["Encryption:IV"] ?? throw new ArgumentNullException("Encryption:IV not configured");
        }

        public string EncryptAES(string plainText)
        {
            try
            {
                byte[] keyBytes = Convert.FromHexString(_key);
                byte[] ivBytes = Convert.FromHexString(_iv);
                byte[] plainBytes = Encoding.ASCII.GetBytes(plainText);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = keyBytes;
                    aes.IV = ivBytes;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    using ICryptoTransform encryptor = aes.CreateEncryptor();
                    using MemoryStream msEncrypt = new MemoryStream();
                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        csEncrypt.Write(plainBytes, 0, plainBytes.Length);
                    }

                    return Convert.ToHexString(msEncrypt.ToArray());
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Encryption error: {ex.Message}");
                throw;
            }
        }

        public string DecryptAES(string cipherText)
        {
            try
            {
                byte[] keyBytes = Convert.FromHexString(_key);
                byte[] ivBytes = Convert.FromHexString(_iv);
                byte[] cipherBytes = Convert.FromHexString(cipherText);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = keyBytes;
                    aes.IV = ivBytes;
                    aes.Mode = CipherMode.CBC;
                    aes.Padding = PaddingMode.PKCS7;

                    using ICryptoTransform decryptor = aes.CreateDecryptor();
                    using MemoryStream msDecrypt = new MemoryStream(cipherBytes);
                    using CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
                    using StreamReader srDecrypt = new StreamReader(csDecrypt, Encoding.ASCII);

                    return srDecrypt.ReadToEnd();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Decryption error: {ex.Message}");
                throw;
            }
        }

        public static (string Key, string IV) GenerateNewKeyAndIV()
        {
            using var aes = Aes.Create();
            aes.GenerateKey();
            aes.GenerateIV();
            return (
                Convert.ToHexString(aes.Key),
                Convert.ToHexString(aes.IV)
            );
        }
    }
}