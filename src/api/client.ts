import type { AuthResponse, ProblemDetails } from './types';
import { ENV_API_URL, ENV_IS_DEV } from './env';

/**
 * Em desenvolvimento o front roda em `:5173` e a API em `:5099`, então a URL
 * precisa ser absoluta. Em produção, `VITE_API_URL` aponta para a API
 * publicada; sem ela, as chamadas vão para a mesma origem.
 */
export const resolveApiBaseUrl = (): string => {
  const configured = ENV_API_URL.trim();
  if (configured) return configured.replace(/\/$/, '');
  return ENV_IS_DEV ? 'http://localhost:5099' : '';
};

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ProblemDetails;

  constructor(status: number, message: string, details?: ProblemDetails) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }

  /** Erro de rede/servidor indisponível: o app deve seguir no modo convidado. */
  get isOffline(): boolean {
    return this.status === 0;
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<AuthResponse | null> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** `false` evita a tentativa de refresh (usado nas próprias rotas de auth). */
  retryOnUnauthorized?: boolean;
};

const parseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const toApiError = (status: number, payload: unknown): ApiError => {
  const problem = (payload ?? {}) as ProblemDetails;

  // Erros de validação do MVC vêm em `errors`, sem `detail` preenchido.
  const validationMessage = problem.errors
    ? Object.values(problem.errors).flat()[0]
    : undefined;

  const message =
    problem.detail ?? validationMessage ?? problem.title ?? 'Falha na requisição';

  return new ApiError(status, message, problem);
};

type RawRequestOptions = Omit<RequestOptions, 'retryOnUnauthorized'>;

const rawRequest = async (
  path: string,
  options: RawRequestOptions = {},
): Promise<unknown> => {
  const { body, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);
  if (body !== undefined) requestHeaders.set('Content-Type', 'application/json');
  if (accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${resolveApiBaseUrl()}${path}`, {
      ...rest,
      headers: requestHeaders,
      // Necessário para o cookie de refresh viajar entre origens.
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor.');
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  return payload;
};

/**
 * Renova o token com o cookie de refresh. Chamadas concorrentes compartilham a
 * mesma promise: sem isso, várias requisições em 401 disparariam vários
 * refreshes e o segundo invalidaria o cookie rotacionado pelo primeiro.
 */
export const refreshSession = async (): Promise<AuthResponse | null> => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const data = (await rawRequest('/auth/refresh', {
        method: 'POST',
      })) as AuthResponse;
      accessToken = data.accessToken;
      return data;
    } catch {
      accessToken = null;
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { retryOnUnauthorized = true, ...rest } = options;

  try {
    return (await rawRequest(path, rest)) as T;
  } catch (error) {
    const isUnauthorized = error instanceof ApiError && error.status === 401;

    if (!isUnauthorized || !retryOnUnauthorized || !accessToken) {
      throw error;
    }

    // Token expirado no meio da sessão: renova e repete uma única vez.
    const refreshed = await refreshSession();
    if (!refreshed) throw error;

    return (await rawRequest(path, rest)) as T;
  }
};
