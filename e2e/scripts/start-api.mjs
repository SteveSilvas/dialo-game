#!/usr/bin/env node
/**
 * Sobe a API para o E2E com um banco próprio (`dialo_e2e`), recriado a cada
 * execução. Usar o banco de desenvolvimento destruiria os dados de quem roda
 * os testes localmente, e um banco sujo deixaria o resultado dos testes
 * dependente do que rodou antes.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import { Client } from 'pg';

const API_PORT = Number(process.env.DIALO_E2E_API_PORT ?? 5098);
const WEB_ORIGIN = process.env.DIALO_E2E_WEB_ORIGIN ?? 'http://localhost:4173';
const DATABASE = process.env.DIALO_E2E_DATABASE ?? 'dialo_e2e';
const DOTNET = process.env.DIALO_E2E_DOTNET ?? 'dotnet';
const TEMPLATE =
  process.env.ConnectionStrings__Default ??
  'Host=127.0.0.1;Port=5432;Database=dialo_game;Username=dialo;Password=dialo_dev';

const parseConnectionString = (value) =>
  Object.fromEntries(
    value
      .split(';')
      .filter((pair) => pair.trim() !== '')
      .map((pair) => {
        const separator = pair.indexOf('=');
        return [
          pair.slice(0, separator).trim().toLowerCase(),
          pair.slice(separator + 1).trim(),
        ];
      }),
  );

const credentials = () => {
  const parts = parseConnectionString(TEMPLATE);
  return {
    host: parts.host ?? '127.0.0.1',
    port: Number(parts.port ?? 5432),
    user: parts.username ?? parts.userid ?? 'dialo',
    password: parts.password ?? '',
  };
};

const resetDatabase = async () => {
  const admin = new Client({ ...credentials(), database: 'postgres' });
  await admin.connect();

  try {
    const existing = await admin.query('select 1 from pg_database where datname = $1', [
      DATABASE,
    ]);

    if (existing.rowCount === 0) {
      await admin.query(`create database "${DATABASE}"`);
    }
  } finally {
    await admin.end();
  }

  // O schema em branco deixa as migrations e o seed como única fonte do
  // catálogo, exatamente como em um deploy novo.
  const target = new Client({ ...credentials(), database: DATABASE });
  await target.connect();

  try {
    await target.query('drop schema if exists public cascade');
    await target.query('create schema public');
  } finally {
    await target.end();
  }
};

const connectionString = () => {
  const parts = parseConnectionString(TEMPLATE);
  return Object.entries({ ...parts, database: DATABASE })
    .map(([key, value]) => `${key}=${value}`)
    .join(';');
};

const startApi = () => {
  const args = [
    'run',
    '--project',
    'apps/api/src/DialoGame.Api',
    '--no-launch-profile',
  ];

  const child = spawn(DOTNET, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Production',
      ASPNETCORE_URLS: `http://localhost:${API_PORT}`,
      ConnectionStrings__Default: connectionString(),
      Jwt__SigningKey:
        process.env.Jwt__SigningKey ?? 'chave-de-e2e-com-mais-de-32-caracteres!',
      Jwt__Issuer: 'dialo-game',
      Jwt__Audience: 'dialo-game-web',
      Cors__AllowedOrigins__0: WEB_ORIGIN,
      ApplyMigrationsOnStartup: 'true',
      Auth__RefreshCookieSecure: 'false',
      RateLimiting__Enabled: 'false',
    },
  });

  const shutdown = (signal) => () => child.kill(signal);
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));

  child.on('exit', (code) => process.exit(code ?? 0));
};

try {
  await resetDatabase();
  console.log(`Banco "${DATABASE}" recriado. Subindo a API em http://localhost:${API_PORT}.`);
} catch (error) {
  console.error(
    'Não foi possível preparar o Postgres do E2E. Suba o banco (docker compose) e confira ConnectionStrings__Default.',
  );
  console.error(error);
  process.exit(1);
}

startApi();
