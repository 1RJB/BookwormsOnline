using System.Security.Cryptography;
using System.Text;

namespace BookwormOnline.Services
{
    public class EncryptionService
    {
        private readonly IConfiguration _configuration;
        private readonly byte[] _key;
        private readonly byte[] _iv;

        public EncryptionService(IConfiguration configuration)
        {
            _configuration = configuration;
            // Get key and IV from secure configuration
            _key = Convert.FromBase64String(_configuration["Encryption:Key"]);
            _iv = Convert.FromBase64String(_configuration["Encryption:IV"]);
        }

        public string EncryptData(string plainText)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            using var encryptor = aes.CreateEncryptor();
            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);

            using var msEncrypt = new MemoryStream();
            using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
            using (var swEncrypt = new StreamWriter(csEncrypt))
            {
                swEncrypt.Write(plainText);
            }

            return Convert.ToBase64String(msEncrypt.ToArray());
        }

        public string DecryptData(string cipherText)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;

            using var decryptor = aes.CreateDecryptor();
            byte[] cipherBytes = Convert.FromBase64String(cipherText);

            using var msDecrypt = new MemoryStream(cipherBytes);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var srDecrypt = new StreamReader(csDecrypt);

            return srDecrypt.ReadToEnd();
        }

        public static (string Key, string IV) GenerateNewKeyAndIV()
        {
            using var aes = Aes.Create();
            aes.GenerateKey();
            aes.GenerateIV();
            return (
                Convert.ToBase64String(aes.Key),
                Convert.ToBase64String(aes.IV)
            );
        }
    }
}
