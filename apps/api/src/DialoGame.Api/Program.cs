using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using DialoGame.Api.Logging;
using DialoGame.Api.Metrics;
using DialoGame.Infrastructure.Options;
using DialoGame.Infrastructure.Persistence;
using DialoGame.Infrastructure.Persistence.Seed;
using DialoGame.Infrastructure.Security;
using DialoGame.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Metrics;
using Serilog;
using Serilog.Formatting.Compact;

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

var loggingOptions = builder.Configuration.GetSection(LoggingOptions.SectionName)
    .Get<LoggingOptions>() ?? new LoggingOptions();

builder.Services.AddOptions<MetricsOptions>()
    .Bind(builder.Configuration.GetSection(MetricsOptions.SectionName))
    .ValidateDataAnnotations()
    .ValidateOnStart();

var metricsOptions = builder.Configuration.GetSection(MetricsOptions.SectionName)
    .Get<MetricsOptions>() ?? new MetricsOptions();

if (loggingOptions.Enabled)
{
    // A política de destructuring é registrada aqui, e não em cada chamada de log,
    // para que um `Log.Information("{Body}", body)` novo não vaze senha ou token.
    builder.Services.AddSerilog((services, loggerConfiguration) => loggerConfiguration
        .ReadFrom.Configuration(builder.Configuration)
        .ReadFrom.Services(services)
        .Destructure.With<SensitiveDataDestructuringPolicy>()
        .Enrich.FromLogContext()
        .WriteTo.Console(new CompactJsonFormatter()));
}

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

// Registrado sempre: sem listener o Meter não custa nada, e o controller pode
// injetá-lo sem checar configuração. Quem decide se os números saem é o
// `AddMeter` abaixo, que só roda com Metrics:Enabled.
builder.Services.AddSingleton<DialoMetrics>();

if (metricsOptions.Enabled)
{
    builder.Services.AddOpenTelemetry()
        .WithMetrics(metrics => metrics
            .AddAspNetCoreInstrumentation()
            .AddMeter(DialoMetrics.MeterName)
            .AddPrometheusExporter());
}

if (loggingOptions.Enabled)
{
    builder.Services.AddExceptionHandler<LoggingExceptionHandler>();
}

var app = builder.Build();

if (loggingOptions.Enabled)
{
    // Uma linha por requisição, com método, rota, status e duração. É o resumo que
    // a issue pede; o corpo e os headers não entram para não arrastar credencial.
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate =
            "{RequestMethod} {RequestPath} respondeu {StatusCode} em {Elapsed:0.0}ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestId", httpContext.TraceIdentifier);
        };
    });
}

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

if (metricsOptions.Enabled)
{
    if (string.IsNullOrWhiteSpace(metricsOptions.Token))
    {
        // Sem token o endpoint não sobe. Uma rota de métrica aberta entrega o mapa
        // do tráfego (rotas, volume, taxa de erro) para qualquer um que a encontre.
        var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Metrics");
        logger.LogWarning(
            "Metrics:Token não configurado; {Path} não será publicado.", metricsOptions.Path);
    }
    else
    {
        // Antes de UseAuthentication: o scrape não tem JWT e não deve gastar uma
        // verificação de token falha a cada coleta. A ramificação por caminho
        // resolve a rota e para o pipeline ali — os controllers nem são avaliados.
        app.UseOpenTelemetryPrometheusScrapingEndpoint(
            meterProvider: null,
            predicate: context => ScrapeEndpoint.Matches(context, metricsOptions),
            path: null,
            configureBranchedPipeline: branch => branch.UseMiddleware<MetricsTokenMiddleware>(),
            optionsName: null);
    }
}

app.UseAuthentication();
app.UseAuthorization();

if (metricsOptions.Enabled)
{
    // Depois da autorização: a rota já foi resolvida, e é dela que sai o template
    // usado como rótulo — nunca o caminho concreto, que teria cardinalidade aberta.
    app.UseMiddleware<MetricsMiddleware>();
}

app.MapControllers();
app.MapHealthChecks("/health");

await app.RunAsync();

public partial class Program;
