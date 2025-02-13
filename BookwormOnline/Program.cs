using BookwormOnline.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BookwormOnline.Middleware;
using AspNetCoreRateLimit;
using BookwormOnline.Services;

var builder = WebApplication.CreateBuilder(args);

// Ensure wwwroot exists and set WebRootPath
var wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
Directory.CreateDirectory(wwwrootPath);
builder.Environment.WebRootPath = wwwrootPath;

// Configure EF Core
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add controllers
builder.Services.AddControllersWithViews();

// Rate limiting
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddInMemoryRateLimiting();

// Configure JWT authentication (if still needed for token-based flows)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"])),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("Authentication failed: " + context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("Token validated successfully");
                return Task.CompletedTask;
            }
        };
    });

// CORS to allow cookies from the frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowCredentials()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Session configuration
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    // Set session idle timeout
    options.IdleTimeout = TimeSpan.FromMinutes(10);
    options.Cookie.Name = ".BookwormsOnline.Session";
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

// reCAPTCHA & Antiforgery
builder.Services.AddAntiforgery(opts => { opts.HeaderName = "X-XSRF-TOKEN"; });
builder.Services.AddHttpClient<ReCaptchaService>();
builder.Services.AddTransient<ReCaptchaService>();

// Additional services
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TwoFactorService>();
builder.Services.AddScoped<EncryptionService>();

// Build the app
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseSession();

// Additional security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Content-Security-Policy",
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';");
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();

app.UseIpRateLimiting();

app.MapControllers();
app.Run();