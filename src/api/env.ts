/**
 * Configuração injetada em tempo de build pelo Vite (`define` no
 * `vite.config.ts`). Não usa `import.meta` de propósito: o Jest roda em
 * CommonJS e não transpila essa sintaxe.
 */
declare const __DIALO_API_URL__: string | undefined;
declare const __DIALO_IS_DEV__: boolean | undefined;

export const ENV_API_URL =
  typeof __DIALO_API_URL__ === 'undefined' ? '' : __DIALO_API_URL__;

export const ENV_IS_DEV =
  typeof __DIALO_IS_DEV__ === 'undefined' ? false : __DIALO_IS_DEV__;
