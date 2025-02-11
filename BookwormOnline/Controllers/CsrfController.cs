using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;

namespace BookwormOnline.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CsrfController : ControllerBase
    {
        private readonly IAntiforgery _antiforgery;

        public CsrfController(IAntiforgery antiforgery)
        {
            _antiforgery = antiforgery;
        }

        [HttpGet("token")]
        public IActionResult GetToken()
        {
            var tokens = _antiforgery.GetAndStoreTokens(HttpContext);
            return Ok(new { token = tokens.RequestToken });
        }
    }
}