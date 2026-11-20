import { defineConfig, devices } from '@playwright/test';
import { API_PORT, API_URL, WEB_PORT, WEB_URL } from './e2e/support/env';

/**
 * E2E da trilha: navegador de verdade contra o front construído (`vite
 * preview`) e a API .NET com Postgres. É o único lugar onde login, cookie de
 * refresh, importação do progresso de convidado e desbloqueio de módulo são
 * exercitados juntos — teste de componente não alcança essas costuras.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  // Os specs criam contas próprias, mas todos compartilham a mesma API e o
  // mesmo banco: paralelizar dentro do arquivo só geraria espera.
  fullyParallel: false,
  workers: process.env.CI ? 2 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  /**
   * A URL da API é fixada no bundle em tempo de build (`VITE_API_URL` no
   * `vite.config.ts`), então o preview precisa ser construído depois de a API
   * subir — o mesmo caminho de produção.
   */
  webServer: [
    {
      command: 'node e2e/scripts/start-api.mjs',
      url: `${API_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: { DIALO_E2E_WEB_ORIGIN: WEB_URL, DIALO_E2E_API_PORT: String(API_PORT) },
    },
    {
      command: `npm run build && npm run preview -- --port ${WEB_PORT} --strictPort`,
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
      env: { VITE_API_URL: API_URL },
    },
  ],
});
