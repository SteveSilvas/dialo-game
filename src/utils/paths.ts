/**
 * URLs da trilha.
 *
 * O módulo 01 mantém o endereço curto (`/modulo-01`), que já circula em links e
 * testes; os demais usam a rota genérica (`/modulo/modulo-02`), servida pela
 * mesma tela.
 */
import type { Module } from '../api/types';
import { canRenderConfig, parseActivityConfig } from './activityConfig';

const SHORT_MODULE_SLUGS = ['modulo-01'];

/**
 * Módulos com telas escritas à mão, anteriores à tela genérica. Eles ignoram o
 * `configJson` e não podem ser julgados pela config.
 */
const HAND_WRITTEN_MODULES = ['modulo-01'];

/** Tela da trilha completa, usada quando não há atividade para abrir. */
export const TRAIL_PATH = '/trilha';

/**
 * Módulo jogável é o que tem ao menos uma atividade que o front sabe renderizar.
 * Derivar isso da config evita a lista fixa que precisava ser lembrada a cada
 * módulo novo — e que, esquecida, deixava a atividade inalcançável.
 */
export const isPlayableModule = (module: Pick<Module, 'slug' | 'activities'>): boolean =>
  HAND_WRITTEN_MODULES.includes(module.slug) ||
  module.activities.some((activity) => canRenderConfig(parseActivityConfig(activity)));

export const modulePath = (moduleSlug: string): string =>
  SHORT_MODULE_SLUGS.includes(moduleSlug) ? `/${moduleSlug}` : `/modulo/${moduleSlug}`;

/**
 * Caminho de uma atividade. O módulo 01 tem telas escritas à mão; os demais caem
 * na rota genérica, que escolhe o componente pelo `type` da atividade.
 */
export const activityPath = (moduleSlug: string, activitySlug: string): string =>
  `${modulePath(moduleSlug)}/${activitySlug}`;

export const conclusionPath = (moduleSlug: string): string =>
  `${modulePath(moduleSlug)}/conclusao`;
