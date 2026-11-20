/**
 * Trilha local usada quando a API não responde. Só o módulo 01 tem atividades
 * implementadas no front; módulos novos existem apenas no catálogo do servidor.
 */
export type LocalActivity = {
  slug: string;
  title: string;
};

export type LocalModule = {
  title: string;
  description: string;
  activities: LocalActivity[];
};

export const LOCAL_MODULES: Record<string, LocalModule> = {
  'modulo-01': {
    title: 'RECONHECER LETRAS',
    description: 'VAMOS APRENDER A RECONHECER OS SÍMBOLOS?',
    activities: [
      { slug: 'atividade-01', title: 'LETRAS' },
      { slug: 'atividade-02', title: 'NÚMEROS' },
      { slug: 'atividade-03', title: 'VOGAIS' },
      { slug: 'atividade-04', title: 'CONSOANTES' },
      { slug: 'atividade-05', title: 'DESAFIO' },
    ],
  },
};

export const localModule = (moduleSlug: string): LocalModule | undefined =>
  LOCAL_MODULES[moduleSlug];
