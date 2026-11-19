/**
 * Espelha `ScoreCalculator` da API. O servidor é a fonte da verdade para quem
 * tem conta; esta cópia existe para o modo convidado mostrar as mesmas
 * estrelas que a criança veria depois de entrar.
 */

export const MAX_STARS = 3;

export const calculateStars = (correctHits: number, errors: number): number => {
  if (correctHits <= 0) return 0;

  const total = correctHits + Math.max(errors, 0);
  if (total === 0) return 0;

  const accuracy = correctHits / total;
  if (accuracy >= 1) return 3;
  if (accuracy >= 0.8) return 2;
  if (accuracy >= 0.5) return 1;
  return 0;
};

/** Mais acertos vence; no empate, menos erros. Nunca piora o registro. */
export const mergeBestAttempt = (
  currentBestScore: number,
  currentErrors: number,
  newBestScore: number,
  newErrors: number,
): { bestScore: number; errors: number } => {
  const bestErrors = Math.max(newErrors, 0);

  if (newBestScore > currentBestScore) {
    return { bestScore: newBestScore, errors: bestErrors };
  }
  if (newBestScore < currentBestScore) {
    return { bestScore: currentBestScore, errors: currentErrors };
  }
  return { bestScore: currentBestScore, errors: Math.min(currentErrors, bestErrors) };
};
