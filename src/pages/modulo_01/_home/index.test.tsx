import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider, createStore } from 'jotai';
import Modulo01Home from './index';
import { sessionAtom } from '../../../state/session';
import { setAccessToken } from '../../../api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const buildModule = (isUnlocked: boolean) => ({
  slug: 'modulo-01',
  title: 'Reconhecer símbolos',
  description: 'Distinguir letras e números.',
  concept: 'Princípio alfabético',
  order: 1,
  status: isUnlocked ? 'current' : 'locked',
  isUnlocked,
  requiredTotal: 2,
  requiredCompleted: 0,
  stars: 0,
  maxStars: 6,
  activities: [
    {
      slug: 'atividade-01',
      title: 'Selecionar as letras',
      type: 'selectSymbols',
      order: 1,
      isRequired: true,
      configJson: '{}',
      progress: null,
    },
    {
      slug: 'atividade-02',
      title: 'Selecionar os números',
      type: 'selectSymbols',
      order: 2,
      isRequired: true,
      configJson: '{}',
      progress: null,
    },
  ],
});

const renderHome = () => {
  const store = createStore();
  store.set(sessionAtom, { status: 'anonymous', user: null });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Modulo01Home />
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

describe('home do módulo', () => {
  it('mostra as atividades como links quando o módulo está liberado', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [buildModule(true)] }));

    renderHome();

    const link = await screen.findByRole('link', { name: /SELECIONAR AS LETRAS/i });
    expect(link).toHaveAttribute('href', '/modulo-01/atividade-01');
  });

  it('mostra o título e o resumo de estrelas vindos da API', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [buildModule(true)] }));

    renderHome();

    expect(
      await screen.findByRole('heading', { name: 'RECONHECER SÍMBOLOS' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('0 de 12 estrelas');
  });

  it('não deixa clicar em atividade de módulo bloqueado', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ modules: [buildModule(false)] }));

    renderHome();

    expect(
      await screen.findByRole('img', { name: 'SELECIONAR AS LETRAS bloqueada' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /SELECIONAR AS LETRAS/i }),
    ).not.toBeInTheDocument();
  });

  it('cai na trilha local quando a API não responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderHome();

    expect(
      await screen.findByText(/Jogando sem conexão com o servidor/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /LETRAS/i }),
    ).toHaveAttribute('href', '/modulo-01/atividade-01');
  });
});

describe('home de módulo concluído', () => {
  it('leva à tela de conclusão em vez de recomeçar as atividades', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        modules: [
          {
            ...buildModule(true),
            status: 'completed',
            requiredCompleted: 2,
          },
        ],
      }),
    );

    renderHome();

    const link = await screen.findByRole('link', { name: 'VER CONCLUSÃO' });
    expect(link).toHaveAttribute('href', '/modulo-01/conclusao');
  });
});
