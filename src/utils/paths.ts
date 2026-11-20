/**
 * URLs da trilha. O módulo 01 mantém o endereço curto (`/modulo-01`), que já
 * circula em links e testes; módulos novos usam a rota genérica
 * (`/modulo/modulo-02`), servida pela mesma tela.
 */
const SHORT_MODULE_SLUGS = ['modulo-01'];

export const modulePath = (moduleSlug: string): string =>
  SHORT_MODULE_SLUGS.includes(moduleSlug) ? `/${moduleSlug}` : `/modulo/${moduleSlug}`;

export const activityPath = (moduleSlug: string, activitySlug: string): string =>
  `${modulePath(moduleSlug)}/${activitySlug}`;

export const conclusionPath = (moduleSlug: string): string =>
  `${modulePath(moduleSlug)}/conclusao`;
