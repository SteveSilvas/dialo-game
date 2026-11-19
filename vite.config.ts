import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * As tags de SEO/Open Graph precisam de URL absoluta, mas o domínio de produção
 * é definido no deploy. `VITE_SITE_URL` preenche esse valor; sem ela as URLs
 * ficam relativas, o que ainda funciona localmente e em preview.
 */
const siteUrlPlugin = (siteUrl: string) => ({
  name: 'site-url',
  transformIndexHtml(html: string) {
    return html.split('%SITE_URL%').join(siteUrl)
  },
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL ?? '').replace(/\/$/, '')

  return {
    plugins: [react(), tailwindcss(), siteUrlPlugin(siteUrl)],
  }
})
