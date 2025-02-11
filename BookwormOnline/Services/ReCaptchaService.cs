using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace BookwormOnline.Services
{
    public class ReCaptchaService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public ReCaptchaService(IConfiguration configuration, HttpClient httpClient)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<bool> VerifyToken(string token)
        {
            var secretKey = _configuration["ReCaptcha:SecretKey"];
            var response = await _httpClient.GetStringAsync($"https://www.google.com/recaptcha/api/siteverify?secret={secretKey}&response={token}");
            var jsonResponse = JObject.Parse(response);
            return jsonResponse.Value<bool>("success");
        }
    }
}