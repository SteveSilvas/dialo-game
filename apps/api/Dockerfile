# Build em duas etapas: o SDK compila, a imagem final leva só o runtime.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Directory.Build.props ./
COPY src/DialoGame.Domain/DialoGame.Domain.csproj src/DialoGame.Domain/
COPY src/DialoGame.Infrastructure/DialoGame.Infrastructure.csproj src/DialoGame.Infrastructure/
COPY src/DialoGame.Api/DialoGame.Api.csproj src/DialoGame.Api/
RUN dotnet restore src/DialoGame.Api/DialoGame.Api.csproj

COPY src/ src/
RUN dotnet publish src/DialoGame.Api/DialoGame.Api.csproj \
    -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

# A imagem Debian slim não traz cliente HTTP, e o healthcheck do compose precisa
# de um. Instalado só no estágio final para não inchar a imagem de build.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Usuário sem privilégios: a imagem base já traz o usuário "app".
USER app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "DialoGame.Api.dll"]
