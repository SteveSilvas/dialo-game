import type { Activity } from '../api/types';
import {
  canRenderConfig,
  isSupportedConfig,
  parseActivityConfig,
} from './activityConfig';

const activity = (
  type: Activity['type'],
  config: unknown,
): Activity => ({
  slug: 'modulo-03-atividade-01',
  title: 'Junte as sílabas',
  type,
  order: 1,
  isRequired: true,
  configJson: typeof config === 'string' ? config : JSON.stringify(config),
  progress: null,
});

describe('parseActivityConfig', () => {
  it('lê a config de montar palavra', () => {
    const config = parseActivityConfig(
      activity('buildWord', {
        prompt: 'MONTE A PALAVRA: BALA',
        word: 'BALA',
        syllables: ['BA', 'LA'],
      }),
    );

    expect(config).toEqual({
      kind: 'buildWord',
      word: 'BALA',
      syllables: ['BA', 'LA'],
      prompt: 'MONTE A PALAVRA: BALA',
    });
    expect(canRenderConfig(config)).toBe(true);
  });

  it('gera o enunciado quando a config não traz prompt', () => {
    const config = parseActivityConfig(
      activity('buildWord', { word: 'bala', syllables: ['ba', 'la'] }),
    );

    expect(config).toMatchObject({
      kind: 'buildWord',
      word: 'BALA',
      prompt: 'MONTE A PALAVRA: BALA',
    });
  });

  it('rejeita sílabas que não remontam a palavra', () => {
    // Embaralhar e reordenar uma config inconsistente daria uma atividade
    // impossível de concluir; é melhor marcar como indisponível.
    const config = parseActivityConfig(
      activity('buildWord', { word: 'BALA', syllables: ['BA', 'BO'] }),
    );

    expect(config.kind).toBe('unsupported');
    expect(canRenderConfig(config)).toBe(false);
  });

  it('rejeita config sem sílabas', () => {
    const config = parseActivityConfig(activity('buildWord', { word: 'BALA' }));

    expect(config.kind).toBe('unsupported');
  });

  it('não quebra com JSON inválido', () => {
    const config = parseActivityConfig(activity('buildWord', '{nao é json'));

    expect(config).toEqual({ kind: 'unsupported', reason: 'configJson inválido' });
  });

  it('não quebra quando o JSON não é objeto', () => {
    const config = parseActivityConfig(activity('buildWord', '[1,2,3]'));

    expect(config.kind).toBe('unsupported');
  });

  it('lê a config de seleção de símbolos', () => {
    const config = parseActivityConfig(
      activity('selectSymbols', { prompt: 'BOLA', answer: 'b', distractors: ['d', 'p'] }),
    );

    expect(config).toEqual({
      kind: 'selectSymbols',
      prompt: 'BOLA',
      answers: ['b'],
      distractors: ['d', 'p'],
    });
    // Config legível, mas a tela genérica ainda não tem componente de seleção.
    expect(isSupportedConfig(config)).toBe(true);
    expect(canRenderConfig(config)).toBe(false);
  });

  it('marca como indisponível o tipo que ainda não tem componente', () => {
    const config = parseActivityConfig(
      activity('dragSymbols', { predicate: 'consonant' }),
    );

    expect(config.kind).toBe('unsupported');
    expect(canRenderConfig(config)).toBe(false);
  });
});

describe('parseActivityConfig — selectPicture', () => {
  const picture = (config: unknown) => parseActivityConfig(activity('selectPicture', config));

  const valid = {
    prompt: 'QUAL FIGURA COMEÇA COM O MESMO SOM?',
    speak: 'Bola',
    answer: 'Bala',
    options: [
      { label: 'Bala', emoji: '🍬' },
      { label: 'Dado', emoji: '🎲' },
    ],
  };

  it('lê a config de escolher figura', () => {
    const config = picture(valid);

    expect(config).toEqual({
      kind: 'selectPicture',
      prompt: 'QUAL FIGURA COMEÇA COM O MESMO SOM?',
      speak: 'Bola',
      answer: 'Bala',
      options: [
        { label: 'Bala', emoji: '🍬' },
        { label: 'Dado', emoji: '🎲' },
      ],
    });
    expect(isSupportedConfig(config)).toBe(true);
    expect(canRenderConfig(config)).toBe(true);
  });

  it('usa a resposta como fala quando a config não traz speak', () => {
    const config = picture({ ...valid, speak: undefined });

    expect(config.kind === 'selectPicture' && config.speak).toBe('Bala');
  });

  it('aceita opção sem figura, que fica só com o rótulo', () => {
    const config = picture({
      ...valid,
      options: [{ label: 'Bala' }, { label: 'Dado' }],
    });

    expect(config.kind === 'selectPicture' && config.options[0]!.emoji).toBeNull();
  });

  it('recusa config cuja resposta não está entre as opções', () => {
    const config = picture({
      ...valid,
      options: [{ label: 'Dado' }, { label: 'Pato' }],
    });

    expect(config.kind).toBe('unsupported');
    expect(canRenderConfig(config)).toBe(false);
  });

  it('recusa config com menos de duas opções', () => {
    const config = picture({ ...valid, options: [{ label: 'Bala' }] });

    expect(config.kind).toBe('unsupported');
  });

  it('recusa opção sem rótulo', () => {
    const config = picture({
      ...valid,
      options: [{ label: 'Bala' }, { emoji: '🎲' }],
    });

    expect(config.kind).toBe('unsupported');
  });

  it('recusa config sem resposta', () => {
    const config = picture({ ...valid, answer: undefined });

    expect(config.kind).toBe('unsupported');
  });
});
