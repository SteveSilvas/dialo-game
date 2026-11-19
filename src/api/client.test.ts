import { ApiError, apiRequest, refreshSession, resolveApiBaseUrl, setAccessToken } from './client';

/**
 * O jsdom desta versão não traz `fetch` nem `Response`, então o teste monta
 * uma resposta mínima com a mesma forma que o cliente consome.
 */
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const fetchMock = jest.fn();

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
});

describe('resolveApiBaseUrl', () => {
  it('nunca termina com barra', () => {
    expect(resolveApiBaseUrl()).not.toMatch(/\/$/);
  });
});

describe('apiRequest', () => {
  it('envia o token de acesso quando existe', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    setAccessToken('token-abc');

    await apiRequest('/catalog');

    const init = fetchMock.mock.calls[0][1];
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer token-abc');
  });

  it('inclui credenciais para o cookie de refresh viajar', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await apiRequest('/catalog');

    expect(fetchMock.mock.calls[0][1].credentials).toBe('include');
  });

  it('converte ProblemDetails em ApiError com a mensagem do servidor', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { title: 'Módulo bloqueado', detail: "O módulo 'modulo-02' ainda não foi liberado." },
        403,
      ),
    );

    await expect(apiRequest('/progress/activities/x')).rejects.toMatchObject({
      status: 403,
      message: "O módulo 'modulo-02' ainda não foi liberado.",
    });
  });

  it('usa o primeiro erro de validação quando não há detail', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          title: 'One or more validation errors occurred.',
          errors: { Username: ['O username aceita apenas letras, números e underscore.'] },
        },
        400,
      ),
    );

    await expect(
      apiRequest('/auth/register', { method: 'POST', body: {} }),
    ).rejects.toMatchObject({
      message: 'O username aceita apenas letras, números e underscore.',
    });
  });

  it('marca falha de rede como offline', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await apiRequest('/catalog').catch((caught) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isOffline).toBe(true);
  });

  it('renova o token no 401 e repete a requisição uma vez', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ title: 'expirado' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'novo', user: {} }))
      .mockResolvedValueOnce(jsonResponse({ modules: [] }));

    setAccessToken('antigo');
    const result = await apiRequest<{ modules: unknown[] }>('/catalog');

    expect(result.modules).toEqual([]);
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('não tenta renovar quando a sessão é anônima', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ title: 'não' }, 401));

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('refreshSession', () => {
  it('compartilha uma única renovação entre chamadas concorrentes', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ accessToken: 'token', user: { id: '1' } }),
    );

    const [a, b] = await Promise.all([refreshSession(), refreshSession()]);

    expect(a?.accessToken).toBe('token');
    expect(b?.accessToken).toBe('token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('devolve null quando não há sessão', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ title: 'sem sessão' }, 401));

    await expect(refreshSession()).resolves.toBeNull();
  });
});
