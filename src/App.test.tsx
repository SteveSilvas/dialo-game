import { act, fireEvent, render, screen } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import Layout from './components/layout';
import { soundAtom } from './Context/SoundAtom';
import { sessionAtom } from './state/session';
import { saveGuestProgress } from './state/guestProgress';
import { setAccessToken } from './api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

type ProgressFixture = {
  activitySlug: string;
  bestScore: number;
  attempts: number;
  errors: number;
  stars: number;
  completedAt: string | null;
};

const buildActivity = (
  slug: string,
  order: number,
  progress: ProgressFixture | null = null,
) => ({
  slug,
  title: `Atividade ${order}`,
  type: 'selectSymbols',
  order,
  isRequired: true,
  configJson: '{}',
  progress,
});

const completed = (activitySlug: string): ProgressFixture => ({
  activitySlug,
  bestScore: 4,
  attempts: 4,
  errors: 0,
  stars: 3,
  completedAt: '2026-01-01T00:00:00+00:00',
});

const buildCatalog = (activities: ReturnType<typeof buildActivity>[]) => ({
  modules: [
    {
      slug: 'modulo-01',
      title: 'Reconhecer símbolos',
      description: 'Distinguir letras e números.',
      concept: 'Princípio alfabético',
      order: 1,
      status: 'current',
      isUnlocked: true,
      requiredTotal: activities.length,
      requiredCompleted: activities.filter((item) => item.progress?.completedAt).length,
      stars: activities.reduce((sum, item) => sum + (item.progress?.stars ?? 0), 0),
      maxStars: activities.length * 3,
      activities,
    },
  ],
});

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<App />} />
          <Route path="/modulo-01" element={<p>módulo 01</p>} />
          <Route path="/entrar" element={<p>entrar</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const signIn = () =>
  getDefaultStore().set(sessionAtom, {
    status: 'authenticated',
    user: {
      id: '1',
      username: 'bia',
      email: null,
      displayName: 'Bia',
      avatarUrl: null,
      role: 'student',
      createdAt: '2026-01-01T00:00:00+00:00',
    },
  });

const stayGuest = () =>
  getDefaultStore().set(sessionAtom, { status: 'anonymous', user: null });

beforeEach(() => {
  getDefaultStore().set(soundAtom, { isActive: false });
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
  stayGuest();
});

describe('Home (INICIAR)', () => {
  it('não cria players de áudio próprios', () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { container } = renderHome();

    // Só o player centralizado no Layout existe.
    expect(container.querySelectorAll('audio')).toHaveLength(1);
  });

  it('só toca a música de fundo depois do gesto em INICIAR', () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const play = jest.mocked(window.HTMLMediaElement.prototype.play);
    const { container } = renderHome();
    const backgroundAudio = container.querySelector('audio');

    expect(play.mock.instances).not.toContain(backgroundAudio);

    act(() => {
      fireEvent.click(screen.getByText('INICIAR'));
    });

    expect(getDefaultStore().get(soundAtom).isActive).toBe(true);
    expect(play.mock.instances).toContain(backgroundAudio);
  });
});

describe('Home com mapa de progresso', () => {
  it('convida o visitante a criar conta sem bloquear o jogo', async () => {
    fetchMock.mockResolvedValue(jsonResponse(buildCatalog([buildActivity('atividade-01', 1)])));

    renderHome();

    expect(await screen.findByText(/Você joga como visitante/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Entrar ou criar conta' }),
    ).toHaveAttribute('href', '/entrar');
    // O jogo continua acessível para quem não tem conta.
    expect(screen.getByRole('link', { name: /INICIAR/i })).toHaveAttribute(
      'href',
      '/modulo-01/atividade-01',
    );
  });

  it('mostra o resumo de módulos, estrelas e atividades', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildCatalog([
          buildActivity('atividade-01', 1, completed('atividade-01')),
          buildActivity('atividade-02', 2),
        ]),
      ),
    );

    renderHome();

    expect(
      await screen.findByLabelText('0 de 1 módulos concluídos'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('3 de 6 estrelas')).toBeInTheDocument();
    expect(screen.getByLabelText('1 de 2 atividades concluídas')).toBeInTheDocument();
  });

  it('leva o visitante direto para a atividade onde parou', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildCatalog([
          buildActivity('atividade-01', 1),
          buildActivity('atividade-02', 2),
        ]),
      ),
    );
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 4,
      attempts: 4,
      errors: 0,
      completed: true,
    });

    renderHome();

    expect(await screen.findByRole('link', { name: /CONTINUAR/i })).toHaveAttribute(
      'href',
      '/modulo-01/atividade-02',
    );
    expect(screen.getByRole('status')).toHaveTextContent(/ATIVIDADE 2/i);
  });

  it('retoma a atividade pendente de quem está logado', async () => {
    signIn();
    setAccessToken('token');
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildCatalog([
          buildActivity('atividade-01', 1, completed('atividade-01')),
          buildActivity('atividade-02', 2),
        ]),
      ),
    );

    renderHome();

    expect(await screen.findByRole('link', { name: /CONTINUAR/i })).toHaveAttribute(
      'href',
      '/modulo-01/atividade-02',
    );
    expect(screen.queryByText(/Você joga como visitante/i)).not.toBeInTheDocument();
  });

  it('oferece rever o módulo quando tudo já foi concluído', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        buildCatalog([buildActivity('atividade-01', 1, completed('atividade-01'))]),
      ),
    );

    renderHome();

    expect(await screen.findByRole('link', { name: /JOGAR DE NOVO/i })).toHaveAttribute(
      'href',
      '/modulo-01/atividade-01',
    );
    expect(screen.getByRole('status')).toHaveTextContent(/concluiu tudo/i);
  });

  it('mantém a entrada para a trilha completa', async () => {
    fetchMock.mockResolvedValue(jsonResponse(buildCatalog([buildActivity('atividade-01', 1)])));

    renderHome();

    expect(await screen.findByRole('link', { name: 'VER A TRILHA' })).toHaveAttribute(
      'href',
      '/modulo-01',
    );
  });

  it('continua jogável quando a API não responde', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderHome();

    expect(screen.getByRole('link', { name: /INICIAR/i })).toHaveAttribute(
      'href',
      '/modulo-01',
    );
    expect(screen.getByRole('link', { name: 'VER A TRILHA' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/estrelas/)).not.toBeInTheDocument();
  });
});
