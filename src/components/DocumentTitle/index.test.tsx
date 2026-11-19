import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DocumentTitle from './index';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentTitle />
    </MemoryRouter>,
  );

afterEach(() => {
  document.title = '';
});

describe('DocumentTitle', () => {
  it('usa o título da home na raiz', () => {
    renderAt('/');
    expect(document.title).toBe(
      'Alfabetização infantil com jogos interativos | Dialo Game',
    );
  });

  it('dá um título próprio para cada atividade', () => {
    renderAt('/modulo-01/atividade-03');
    expect(document.title).toBe('Atividade 3 — Selecionar as vogais | Dialo Game');
  });

  it('diferencia o módulo da atividade', () => {
    renderAt('/modulo-01');
    expect(document.title).toBe('Módulo 1 — Reconhecer letras | Dialo Game');
  });

  it('marca rotas desconhecidas como não encontradas', () => {
    renderAt('/rota-que-nao-existe');
    expect(document.title).toBe('Página não encontrada | Dialo Game');
  });
});
