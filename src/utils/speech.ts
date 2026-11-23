/**
 * Fala dos enunciados do módulo 02.
 *
 * A Web Speech API resolve a dependência de áudio que bloqueava o módulo: em vez
 * de gravar 50 palavras, o navegador pronuncia a palavra-alvo. Não é
 * equivalente a gravação revisada por educador — a pronúncia varia por voz e por
 * sistema —, mas é o que permite a atividade existir sem infraestrutura de
 * áudio própria.
 *
 * `speechSynthesis` não existe no jsdom nem em navegadores antigos, e a lista de
 * vozes chega de forma assíncrona. Por isso a API é sempre consultada em tempo
 * de chamada, nunca no carregamento do módulo.
 */

import { getDefaultStore } from 'jotai';
import { soundAtom } from '../Context/SoundAtom';

export type SpeechStatus = 'available' | 'unavailable';

const hasSpeech = (): boolean =>
  typeof window !== 'undefined' &&
  // `speechSynthesis` é um objeto, não uma função; `SpeechSynthesisUtterance`
  // é o construtor. Checar os dois pelo mesmo `typeof` deixaria a fala sempre
  // indisponível em navegador real.
  typeof window.speechSynthesis === 'object' &&
  window.speechSynthesis !== null &&
  typeof window.SpeechSynthesisUtterance === 'function';

/**
 * Voz em português do Brasil, quando o sistema oferece uma. Sem ela a fala ainda
 * sai com a voz padrão: uma palavra em português lida por voz inglesa fica
 * estranha, mas continua mais útil que silêncio — e a tela mostra o enunciado
 * escrito, então a atividade não depende só do som.
 */
const pickVoice = (voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const portuguese = voices.filter((voice) => voice.lang.toLowerCase().startsWith('pt'));
  return (
    portuguese.find((voice) => voice.lang.toLowerCase().replace('_', '-') === 'pt-br') ??
    portuguese[0] ??
    null
  );
};

export const getSpeechStatus = (): SpeechStatus =>
  hasSpeech() ? 'available' : 'unavailable';

/**
 * Pronuncia `text` em voz alta. Devolve `false` quando a fala não está
 * disponível, para a tela poder oferecer o enunciado escrito em vez de um botão
 * que não faz nada.
 *
 * A fala anterior é cancelada: duas palavras sobrepostas viram ruído e a
 * criança não entende nenhuma das duas.
 */
export const speak = (text: string): boolean => {
  if (!hasSpeech() || !text.trim()) return false;
  // O botão de som do cabeçalho vale para todo o áudio do jogo. Sem esta
  // checagem a criança desliga o som e a palavra continua sendo falada.
  if (!getDefaultStore().get(soundAtom).isActive) return false;

  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  // Um pouco abaixo do padrão: a fala sintética corre e a criança precisa
  // ouvir o som inteiro para resolver a atividade.
  utterance.rate = 0.85;

  const voice = pickVoice(synthesis.getVoices());
  if (voice) utterance.voice = voice;

  synthesis.speak(utterance);
  return true;
};

export const stopSpeaking = (): void => {
  if (!hasSpeech()) return;
  window.speechSynthesis.cancel();
};
