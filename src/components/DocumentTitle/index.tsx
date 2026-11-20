import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Dialo Game';

/** Cada rota recebe um título próprio; vale a primeira regra que casar. */
const TITLES: Array<[matches: (pathname: string) => boolean, title: string]> = [
  [(path) => path === '/', 'Alfabetização infantil com jogos interativos'],
  [(path) => path === '/entrar', 'Entrar'],
  [(path) => path === '/trilha', 'Sua trilha'],
  [(path) => path === '/modulo-01' || path === '/modulo-01/', 'Módulo 1 — Reconhecer letras'],
  [(path) => path === '/modulo-01/atividade-01', 'Atividade 1 — Selecionar as letras'],
  [(path) => path === '/modulo-01/atividade-02', 'Atividade 2 — Selecionar os números'],
  [(path) => path === '/modulo-01/atividade-03', 'Atividade 3 — Selecionar as vogais'],
  [(path) => path === '/modulo-01/atividade-04', 'Atividade 4 — Selecionar as consoantes'],
  [(path) => path === '/modulo-01/atividade-05', 'Atividade 5 — Guardar as letras na caixa'],
];

/**
 * SPA não troca o `<title>` sozinha: sem isso todas as rotas aparecem com o
 * mesmo título na aba e no histórico do navegador.
 */
const DocumentTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = TITLES.find(([matches]) => matches(pathname));
    const page = match ? match[1] : 'Página não encontrada';
    document.title = `${page} | ${SITE_NAME}`;
  }, [pathname]);

  return null;
};

export default DocumentTitle;
