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

export type ActivityConfig =
  | SelectSymbolsConfig
  | BuildWordConfig
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

const PARSERS: Record<ActivityType, (raw: Record<string, unknown>) => ActivityConfig> = {
  selectSymbols: parseSelectSymbols,
  buildWord: parseBuildWord,
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
): config is SelectSymbolsConfig | BuildWordConfig =>
  config.kind !== 'unsupported';

/**
 * Tipos com componente na tela genérica. É deliberadamente menor que
 * `isSupportedConfig`: o parser sabe ler mais configs do que o front sabe
 * desenhar, e prometer uma atividade que renderiza vazio é pior que dizer que
 * ela ainda não está pronta.
 */
const RENDERABLE_KINDS: ReadonlySet<ActivityConfig['kind']> = new Set(['buildWord']);

export const canRenderConfig = (config: ActivityConfig): boolean =>
  RENDERABLE_KINDS.has(config.kind);
