import {
  clearGuestProgress,
  readGuestProgress,
  saveGuestProgress,
} from './guestProgress';

beforeEach(() => {
  localStorage.clear();
});

describe('progresso de convidado', () => {
  it('começa vazio', () => {
    expect(readGuestProgress()).toEqual([]);
  });

  it('guarda e relê a tentativa', () => {
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 5,
      attempts: 7,
      errors: 2,
      completed: true,
    });

    expect(readGuestProgress()).toEqual([
      {
        activitySlug: 'atividade-01',
        bestScore: 5,
        attempts: 7,
        errors: 2,
        completed: true,
      },
    ]);
  });

  it('substitui o registro da mesma atividade em vez de duplicar', () => {
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 3,
      attempts: 5,
      errors: 4,
      completed: true,
    });
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 6,
      attempts: 6,
      errors: 1,
      completed: true,
    });

    const items = readGuestProgress();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ bestScore: 6, errors: 1, attempts: 11 });
  });

  it('nunca piora o melhor resultado com uma tentativa ruim', () => {
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 8,
      attempts: 10,
      errors: 1,
      completed: true,
    });
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 2,
      attempts: 4,
      errors: 9,
      completed: true,
    });

    expect(readGuestProgress()[0]).toMatchObject({ bestScore: 8, errors: 1 });
  });

  it('no empate de acertos mantém o menor número de erros', () => {
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 5,
      attempts: 5,
      errors: 5,
      completed: true,
    });
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 5,
      attempts: 5,
      errors: 2,
      completed: true,
    });

    expect(readGuestProgress()[0].errors).toBe(2);
  });

  it('mantém a conclusão depois de uma tentativa pior', () => {
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 5,
      attempts: 5,
      errors: 0,
      completed: true,
    });
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 1,
      attempts: 1,
      errors: 5,
      completed: false,
    });

    expect(readGuestProgress()[0].completed).toBe(true);
  });

  it('ignora conteúdo corrompido no storage', () => {
    localStorage.setItem('dialo:guest-progress:v1', '{isso não é json');

    expect(readGuestProgress()).toEqual([]);
  });

  it('ignora itens sem slug', () => {
    localStorage.setItem(
      'dialo:guest-progress:v1',
      JSON.stringify([{ bestScore: 3 }, { activitySlug: 'atividade-02', bestScore: 1 }]),
    );

    expect(readGuestProgress()).toEqual([
      {
        activitySlug: 'atividade-02',
        bestScore: 1,
        attempts: 0,
        errors: 0,
        completed: false,
      },
    ]);
  });

  it('normaliza números inválidos em vez de propagar NaN', () => {
    localStorage.setItem(
      'dialo:guest-progress:v1',
      JSON.stringify([
        {
          activitySlug: 'atividade-01',
          bestScore: 'oito',
          attempts: null,
          errors: -3,
          completed: 'sim',
        },
      ]),
    );

    expect(readGuestProgress()).toEqual([
      {
        activitySlug: 'atividade-01',
        bestScore: 0,
        attempts: 0,
        errors: 0,
        completed: false,
      },
    ]);
  });

  it('limpa tudo ao entrar na conta', () => {
    saveGuestProgress({
      activitySlug: 'atividade-01',
      bestScore: 5,
      attempts: 5,
      errors: 0,
      completed: true,
    });

    clearGuestProgress();

    expect(readGuestProgress()).toEqual([]);
  });
});
