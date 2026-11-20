/**
 * URLs da trilha.
 *
 * O módulo 01 mantém o endereço curto (`/modulo-01`), que já circula em links e
 * testes; os demais usam a rota genérica (`/modulo/modulo-02`), servida pela
 * mesma tela.
 */
const SHORT_MODULE_SLUGS = ['modulo-01'];

/**
 * Módulos com tela de atividade implementada. Os demais existem no catálogo só
 * para a progressão ser verificável; a atividade deles não pode virar link,
 * senão a criança cai num 404.
 */
const PLAYABLE_MODULES = ['modulo-01'];

/** Tela da trilha completa, usada quando não há atividade para abrir. */
export const TRAIL_PATH = '/trilha';

export const isPlayableModule = (moduleSlug: string): boolean =>
  PLAYABLE_MODULES.includes(moduleSlug);

export const modulePath = (moduleSlug: string): string =>
  SHORT_MODULE_SLUGS.includes(moduleSlug) ? `/${moduleSlug}` : `/modulo/${moduleSlug}`;

export const activityPath = (moduleSlug: string, activitySlug: string): string =>
  isPlayableModule(moduleSlug) ? `${modulePath(moduleSlug)}/${activitySlug}` : TRAIL_PATH;

export const conclusionPath = (moduleSlug: string): string =>
  `${modulePath(moduleSlug)}/conclusao`;
