import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Trilha from './index';
import { sessionAtom } from '../../state/session';
import { setAccessToken } from '../../api/client';
import { installMatchMedia, resetMatchMedia } from '../../../test/matchMedia';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const buildModule = (slug: string, order: number, status: string) => ({
  slug,
  title: `Módulo ${order}`,
  description: '',
  concept: '',
  order,
  status,
  isUnlocked: status !== 'locked',
  requiredTotal: 1,
  requiredCompleted: status === 'completed' ? 1 : 0,
  stars: 0,
  maxStars: 3,
  activities: [
    {
      slug: 'atividade-01',
      title: 'Primeira',
      type: 'selectSymbols',
      order: 1,
      isRequired: true,
      configJson: '{}',
      progress: null,
    },
  ],
});

const renderPage = () => {
  const store = createStore();
  store.set(sessionAtom, { status: 'anonymous', user: null });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Trilha />
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  installMatchMedia();
  resetMatchMedia();
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

describe('página da trilha', () => {
  it('mostra os módulos da API com o estado de cada um', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        modules: [buildModule('modulo-01', 1, 'current'), buildModule('modulo-02', 2, 'locked')],
      }),
    );

    renderPage();

    expect(
      await screen.findByRole('heading', { name: 'SUA TRILHA' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /Módulo 1: Módulo 1\./i }),
    ).toHaveAttribute('data-state', 'current');
    expect(
      screen.getByRole('group', { name: /Módulo 2: Módulo 2\./i }),
    ).toHaveAttribute('data-state', 'locked');
  });

  it('cai na trilha local quando a API não responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderPage();

    expect(
      await screen.findByText(/Jogando sem conexão com o servidor/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Módulo 1: Reconhecer símbolos/i }),
    ).toHaveAttribute('href', '/modulo-01');
  });

  it('leva à atividade pela rota real do módulo', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [buildModule('modulo-01', 1, 'current')] }));

    renderPage();

    expect(
      await screen.findByRole('link', { name: /Atividade 1: Primeira\./i }),
    ).toHaveAttribute('href', '/modulo-01/atividade-01');
  });
});
