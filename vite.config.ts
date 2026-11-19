import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * As tags de SEO/Open Graph precisam de URL absoluta, mas o domínio de produção
 * é definido no deploy. `VITE_SITE_URL` tem prioridade; quando ela não existe,
 * o Vercel informa o domínio em `VERCEL_PROJECT_PRODUCTION_URL` (produção) e
 * `VERCEL_URL` (preview), então o card do link funciona sem configuração manual.
 * Sem nenhuma das duas, as URLs ficam relativas: válido em localhost.
 */
const resolveSiteUrl = (env: Record<string, string>): string => {
  const explicit = env.VITE_SITE_URL || process.env.VITE_SITE_URL
  if (explicit) return explicit.replace(/\/$/, '')

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  return vercelHost ? `https://${vercelHost}` : ''
}

const siteUrlPlugin = (siteUrl: string) => ({
  name: 'site-url',
  transformIndexHtml(html: string) {
    return html.split('%SITE_URL%').join(siteUrl)
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(resolveSiteUrl(env))],
    // A URL da API é fixada no bundle: `VITE_API_URL` em produção e
    // `http://localhost:5099` no servidor de desenvolvimento.
    define: {
      __DIALO_API_URL__: JSON.stringify(env.VITE_API_URL ?? ''),
      __DIALO_IS_DEV__: JSON.stringify(mode !== 'production'),
    },
  }
})
