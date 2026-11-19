using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using DialoGame.Infrastructure.Options;
using DialoGame.Infrastructure.Persistence;
using DialoGame.Infrastructure.Persistence.Seed;
using DialoGame.Infrastructure.Security;
using DialoGame.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOptions<JwtOptions>()
    .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<GoogleOptions>()
    .Bind(builder.Configuration.GetSection(GoogleOptions.SectionName));

builder.Services.AddOptions<AuthOptions>()
    .Bind(builder.Configuration.GetSection(AuthOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddOptions<RateLimitingOptions>()
    .Bind(builder.Configuration.GetSection(RateLimitingOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

var rateLimitOptions = builder.Configuration.GetSection(RateLimitingOptions.SectionName)
    .Get<RateLimitingOptions>() ?? new RateLimitingOptions();

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

builder.Services.AddDbContext<DialoGameDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default não configurada.");
    options.UseNpgsql(connectionString);
});

builder.Services.AddScoped<IPasswordHasher, Argon2PasswordHasher>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<ICatalogService>(sp => sp.GetRequiredService<CatalogService>());
builder.Services.AddScoped<IProgressService>(sp => sp.GetRequiredService<CatalogService>());

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("web", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (origins.Length > 0)
        {
            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    if (!rateLimitOptions.Enabled)
    {
        // Limite desligado: usado por suítes de teste que não medem throttling,
        // para que o resultado não dependa de quantas requisições o teste fez antes.
        options.AddPolicy("login", _ => RateLimitPartition.GetNoLimiter("off"));
        options.AddPolicy("register", _ => RateLimitPartition.GetNoLimiter("off"));
        return;
    }

    // Login é o alvo natural de força bruta. A janela fixa por IP limita o
    // volume sem manter estado por usuário em memória.
    options.AddPolicy("login", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "desconhecido";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = rateLimitOptions.LoginPermitLimit,
            Window = TimeSpan.FromMinutes(rateLimitOptions.LoginWindowMinutes),
            QueueLimit = 0,
        });
    });

    options.AddPolicy("register", context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "desconhecido";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = rateLimitOptions.RegisterPermitLimit,
            Window = TimeSpan.FromMinutes(rateLimitOptions.RegisterWindowMinutes),
            QueueLimit = 0,
        });
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase));
    });

builder.Services.AddProblemDetails();
builder.Services.AddHealthChecks()
    .AddDbContextCheck<DialoGameDbContext>("database");

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Configuration.GetValue("ApplyMigrationsOnStartup", false))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<DialoGameDbContext>();
    await db.Database.MigrateAsync();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Seed");
    await ModuleSeeder.SeedAsync(db, logger);
}

app.UseCors("web");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

await app.RunAsync();

public partial class Program;
