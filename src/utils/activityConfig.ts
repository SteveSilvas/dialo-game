import type { Activity, ActivityType } from '../api/types';

/**
 * Leitura do `configJson` que a API envia por atividade.
 *
 * O contrato é: a API manda `type` e um JSON livre; o front interpreta só o que
 * conhece. Config inválido não pode derrubar a tela — a atividade fica
 * indisponível e a criança segue para as outras.
 */

export type SelectSymbolsConfig = {
  kind: 'selectSymbols';
  prompt: string;
  /** Símbolos que satisfazem o predicado. */
  answers: string[];
  distractors: string[];
};

export type BuildWordConfig = {
  kind: 'buildWord';
  /** Palavra alvo, em maiúsculas. */
  word: string;
  /** Sílabas na ordem correta. */
  syllables: string[];
  /** Texto do enunciado, quando a atividade não traz a palavra pronta. */
  prompt: string;
};

export type UnsupportedConfig = { kind: 'unsupported'; reason: string };

export type SelectPictureOption = {
  /** Rótulo mostrado e comparado com a resposta. */
  label: string;
  /** Figura da opção, quando houver. Sem ela a opção fica só com o rótulo. */
  emoji: string | null;
};

export type SelectPictureConfig = {
  kind: 'selectPicture';
  prompt: string;
  /** Enunciado falado pelo TTS. É o som que a criança precisa ouvir. */
  speak: string;
  answer: string;
  options: SelectPictureOption[];
};

export type CompleteWordConfig = {
  kind: 'completeWord';
  prompt: string;
  /** Palavra alvo, em maiúsculas. */
  word: string;
  /** Sílabas na ordem correta. */
  syllables: string[];
  /** Posição da sílaba escondida. */
  missingIndex: number;
  /** Sílaba que falta. */
  answer: string;
  /** Sílabas candidatas, incluindo a resposta. */
  options: string[];
  /** Palavra falada, para quem ainda não lê. */
  speak: string;
  /** Figura da palavra, quando houver. */
  emoji: string | null;
};

export type ActivityConfig =
  | SelectSymbolsConfig
  | BuildWordConfig
  | SelectPictureConfig
  | CompleteWordConfig
  | UnsupportedConfig;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string' && v.length > 0);

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (source: Record<string, unknown>, key: string): string | null => {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
};

/**
 * Sílabas precisam remontar a palavra: o componente embaralha e a criança
 * reordena, então uma config inconsistente produziria uma atividade impossível
 * de concluir. Verificar aqui é mais barato que descobrir na tela.
 */
const syllablesMatchWord = (word: string, syllables: string[]): boolean =>
  syllables.join('').toUpperCase() === word.toUpperCase();

const parseSelectSymbols = (raw: Record<string, unknown>): ActivityConfig => {
  const prompt = readString(raw, 'prompt');
  const answers = raw.answer ?? raw.answers;

  if (!prompt) return { kind: 'unsupported', reason: 'selectSymbols sem prompt' };

  const distractors = isStringArray(raw.distractors) ? raw.distractors : [];

  if (typeof answers === 'string' && answers.trim()) {
    return { kind: 'selectSymbols', prompt, answers: [answers.trim()], distractors };
  }
  if (!isStringArray(answers)) {
    return { kind: 'unsupported', reason: 'selectSymbols sem resposta' };
  }

  return { kind: 'selectSymbols', prompt, answers, distractors };
};

const parseBuildWord = (raw: Record<string, unknown>): ActivityConfig => {
  const word = readString(raw, 'word');
  const syllables = raw.syllables;

  if (!word) return { kind: 'unsupported', reason: 'buildWord sem palavra' };
  if (!isStringArray(syllables)) {
    return { kind: 'unsupported', reason: 'buildWord sem sílabas' };
  }
  if (!syllablesMatchWord(word, syllables)) {
    return { kind: 'unsupported', reason: 'sílabas não formam a palavra' };
  }

  return {
    kind: 'buildWord',
    word: word.toUpperCase(),
    syllables: syllables.map((s) => s.toUpperCase()),
    prompt: readString(raw, 'prompt') ?? `MONTE A PALAVRA: ${word.toUpperCase()}`,
  };
};

const parseSelectPicture = (raw: Record<string, unknown>): ActivityConfig => {
  const prompt = readString(raw, 'prompt');
  const speak = readString(raw, 'speak');
  const answer = readString(raw, 'answer');
  const rawOptions = raw.options;

  if (!prompt) return { kind: 'unsupported', reason: 'selectPicture sem prompt' };
  if (!answer) return { kind: 'unsupported', reason: 'selectPicture sem resposta' };
  if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
    return { kind: 'unsupported', reason: 'selectPicture precisa de ao menos duas opções' };
  }

  const options: SelectPictureOption[] = [];
  for (const item of rawOptions) {
    const record = asRecord(item);
    const label = record ? readString(record, 'label') : null;
    if (!record || !label) {
      return { kind: 'unsupported', reason: 'selectPicture com opção sem rótulo' };
    }
    options.push({ label, emoji: readString(record, 'emoji') });
  }

  // A resposta precisa estar entre as opções: fora delas a atividade fica
  // impossível de concluir, e é melhor dizer isso agora do que deixar a criança
  // tocando em tudo até desistir.
  if (!options.some((option) => option.label === answer)) {
    return { kind: 'unsupported', reason: 'selectPicture com resposta fora das opções' };
  }

  return { kind: 'selectPicture', prompt, speak: speak ?? answer, answer, options };
};

const parseCompleteWord = (raw: Record<string, unknown>): ActivityConfig => {
  const prompt = readString(raw, 'prompt');
  const word = readString(raw, 'word');
  const syllables = raw.syllables;
  const missingIndex = raw.missingIndex;
  const answer = readString(raw, 'answer');
  const options = raw.options;

  if (!prompt) return { kind: 'unsupported', reason: 'completeWord sem prompt' };
  if (!word) return { kind: 'unsupported', reason: 'completeWord sem palavra' };
  if (!isStringArray(syllables)) {
    return { kind: 'unsupported', reason: 'completeWord sem sílabas' };
  }
  // O componente esconde uma posição e espera que a criança a preencha; se as
  // sílabas não remontarem a palavra, o "buraco" aponta para uma palavra que
  // não existe e a atividade fica sem resposta certa.
  if (!syllablesMatchWord(word, syllables)) {
    return { kind: 'unsupported', reason: 'sílabas não formam a palavra' };
  }
  if (
    typeof missingIndex !== 'number' ||
    !Number.isInteger(missingIndex) ||
    missingIndex < 0 ||
    missingIndex >= syllables.length
  ) {
    return { kind: 'unsupported', reason: 'completeWord com posição inválida' };
  }
  if (!answer) return { kind: 'unsupported', reason: 'completeWord sem resposta' };
  if (!isStringArray(options) || options.length < 2) {
    return { kind: 'unsupported', reason: 'completeWord precisa de ao menos duas opções' };
  }
  const hidden = syllables[missingIndex];
  if (!hidden) {
    return { kind: 'unsupported', reason: 'completeWord com posição inválida' };
  }
  if (!options.some((option) => option.toUpperCase() === answer.toUpperCase())) {
    return { kind: 'unsupported', reason: 'completeWord com resposta fora das opções' };
  }
  // A resposta é a sílaba da posição escondida: se divergir, a tela mostra um
  // buraco que a opção "certa" não fecha.
  if (hidden.toUpperCase() !== answer.toUpperCase()) {
    return {
      kind: 'unsupported',
      reason: 'completeWord com resposta diferente da sílaba que falta',
    };
  }

  return {
    kind: 'completeWord',
    prompt,
    word: word.toUpperCase(),
    syllables: syllables.map((s) => s.toUpperCase()),
    missingIndex,
    answer: answer.toUpperCase(),
    options: options.map((option) => option.toUpperCase()),
    speak: readString(raw, 'speak') ?? word,
    emoji: readString(raw, 'emoji'),
  };
};

const PARSERS: Record<ActivityType, (raw: Record<string, unknown>) => ActivityConfig> = {
  selectSymbols: parseSelectSymbols,
  buildWord: parseBuildWord,
  selectPicture: parseSelectPicture,
  completeWord: parseCompleteWord,
  // Tipos ainda sem componente no front. O catálogo pode anunciá-los antes de a
  // tela existir; a atividade aparece como indisponível em vez de quebrar.
  dragSymbols: () => ({ kind: 'unsupported', reason: 'dragSymbols sem componente' }),
  readSentence: () => ({ kind: 'unsupported', reason: 'readSentence sem componente' }),
};

export const parseActivityConfig = (activity: Activity): ActivityConfig => {
  let raw: unknown;
  try {
    raw = JSON.parse(activity.configJson);
  } catch {
    return { kind: 'unsupported', reason: 'configJson inválido' };
  }

  const record = asRecord(raw);
  if (!record) return { kind: 'unsupported', reason: 'configJson não é objeto' };

  const parser = PARSERS[activity.type];
  if (!parser) return { kind: 'unsupported', reason: `tipo desconhecido: ${activity.type}` };

  return parser(record);
};

/** `true` quando o `configJson` está bem formado e o tipo é conhecido. */
export const isSupportedConfig = (
  config: ActivityConfig,
): config is
  | SelectSymbolsConfig
  | BuildWordConfig
  | SelectPictureConfig
  | CompleteWordConfig =>
  config.kind !== 'unsupported';

/**
 * Tipos com componente na tela genérica. É deliberadamente menor que
 * `isSupportedConfig`: o parser sabe ler mais configs do que o front sabe
 * desenhar, e prometer uma atividade que renderiza vazio é pior que dizer que
 * ela ainda não está pronta.
 */
const RENDERABLE_KINDS: ReadonlySet<ActivityConfig['kind']> = new Set([
  'buildWord',
  'selectPicture',
  'completeWord',
]);

export const canRenderConfig = (config: ActivityConfig): boolean =>
  RENDERABLE_KINDS.has(config.kind);
