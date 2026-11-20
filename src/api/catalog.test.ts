import { getCatalog, recordProgress, importProgress } from './catalog';
import { setAccessToken } from './client';

/**
 * Contrato entre front e API. Os tipos de `types.ts` são escritos à mão, então
 * este teste fixa os nomes e formatos que o servidor realmente devolve: se um
 * campo do C# mudar, a falha aparece aqui e não na tela da criança.
 *
 * Os valores abaixo foram copiados da API real (`CatalogService`), com enums
 * em camelCase por causa do `JsonStringEnumConverter` do `Program.cs`.
 */
const catalogPayload = {
  modules: [
    {
      slug: 'modulo-01',
      title: 'Reconhecer letras',
      description: 'Vamos aprender a reconhecer os símbolos?',
      concept: 'letras',
      order: 1,
      status: 'current',
      isUnlocked: true,
      requiredTotal: 5,
      requiredCompleted: 2,
      stars: 7,
      maxStars: 15,
      activities: [
        {
          slug: 'atividade-01',
          title: 'Letras',
          type: 'selectSymbols',
          order: 1,
          isRequired: true,
          configJson: '{"options":["A","B"]}',
          progress: {
            activitySlug: 'atividade-01',
            bestScore: 8,
            attempts: 10,
            errors: 1,
            stars: 2,
            completedAt: '2026-01-01T00:00:00+00:00',
          },
        },
        {
          slug: 'atividade-02',
          title: 'Números',
          type: 'selectSymbols',
          order: 2,
          isRequired: true,
          configJson: '{}',
          progress: null,
        },
      ],
    },
  ],
};

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
});

describe('contrato do catálogo', () => {
  it('lê módulo e atividade com os nomes de campo da API', async () => {
    fetchMock.mockResolvedValue(jsonResponse(catalogPayload));

    const catalog = await getCatalog();
    const module = catalog.modules[0]!;
    const activity = module.activities[0]!;

    expect(module).toMatchObject({
      slug: 'modulo-01',
      status: 'current',
      isUnlocked: true,
      requiredTotal: 5,
      requiredCompleted: 2,
      maxStars: 15,
    });
    expect(activity).toMatchObject({
      slug: 'atividade-01',
      type: 'selectSymbols',
      isRequired: true,
    });
    expect(activity.progress?.stars).toBe(2);
  });

  it('aceita atividade sem progresso (modo convidado)', async () => {
    fetchMock.mockResolvedValue(jsonResponse(catalogPayload));

    const catalog = await getCatalog();

    expect(catalog.modules[0]!.activities[1]!.progress).toBeNull();
  });
});

describe('registro de progresso', () => {
  it('usa PUT no slug da atividade', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ activitySlug: 'atividade-01' }));

    await recordProgress('atividade-01', {
      bestScore: 8,
      attempts: 10,
      errors: 1,
      completed: true,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/progress/activities/atividade-01');
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({
      bestScore: 8,
      attempts: 10,
      errors: 1,
      completed: true,
    });
  });
});

describe('importação do progresso de convidado', () => {
  it('envia os itens em `items`, como o contrato exige', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ imported: 1 }));

    const result = await importProgress([
      { activitySlug: 'atividade-01', bestScore: 5, attempts: 6, errors: 1, completed: true },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/progress/import');
    expect(JSON.parse(init.body)).toEqual({
      items: [
        {
          activitySlug: 'atividade-01',
          bestScore: 5,
          attempts: 6,
          errors: 1,
          completed: true,
        },
      ],
    });
    expect(result.imported).toBe(1);
  });
});
