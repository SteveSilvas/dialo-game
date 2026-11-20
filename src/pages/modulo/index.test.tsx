import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import ModuleHome from './index';
import { sessionAtom } from '../../state/session';
import { setAccessToken } from '../../api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const moduleTwo = {
  slug: 'modulo-02',
  title: 'Sons das letras',
  description: 'Consciência fonológica.',
  concept: 'sons',
  order: 2,
  status: 'current',
  isUnlocked: true,
  requiredTotal: 1,
  requiredCompleted: 0,
  stars: 0,
  maxStars: 3,
  activities: [
    {
      slug: 'atividade-01',
      title: 'Sons',
      type: 'selectSymbols',
      order: 1,
      isRequired: true,
      configJson: '{}',
      progress: null,
    },
  ],
};

const renderAt = (path: string) => {
  const store = createStore();
  store.set(sessionAtom, { status: 'anonymous', user: null });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/modulo/:moduleSlug" element={<ModuleHome />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

describe('home de módulo genérica', () => {
  it('serve um módulo novo pela rota genérica, sem rota própria', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [moduleTwo] }));

    renderAt('/modulo/modulo-02');

    expect(
      await screen.findByRole('heading', { name: 'SONS DAS LETRAS' }),
    ).toBeInTheDocument();

    // O módulo 02 ainda não tem tela de atividade: o card avisa que está em
    // preparação em vez de linkar para uma rota que não existe.
    expect(
      screen.getByRole('img', { name: /SONS em preparação/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'INICIAR MÓDULO' })).not.toBeInTheDocument();
  });

  it('cai no catálogo local do módulo 01 quando a API não responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderAt('/modulo/modulo-01');

    expect(
      await screen.findByRole('heading', { name: 'RECONHECER LETRAS' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DESAFIO/i })).toHaveAttribute(
      'href',
      '/modulo-01/atividade-05',
    );
  });
});
