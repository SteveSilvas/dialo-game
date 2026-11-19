import { apiRequest, setAccessToken } from './client';
import type { AuthResponse, User } from './types';

export type RegisterInput = {
  username: string;
  email?: string;
  password: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

const acceptSession = (data: AuthResponse): AuthResponse => {
  setAccessToken(data.accessToken);
  return data;
};

export const register = async (input: RegisterInput): Promise<AuthResponse> =>
  acceptSession(
    await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { username: input.username, email: input.email || null, password: input.password },
      retryOnUnauthorized: false,
    }),
  );

export const login = async (input: LoginInput): Promise<AuthResponse> =>
  acceptSession(
    await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: input,
      retryOnUnauthorized: false,
    }),
  );

export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> =>
  acceptSession(
    await apiRequest<AuthResponse>('/auth/google', {
      method: 'POST',
      body: { idToken },
      retryOnUnauthorized: false,
    }),
  );

export const logout = async (): Promise<void> => {
  try {
    await apiRequest<null>('/auth/logout', { method: 'POST', retryOnUnauthorized: false });
  } finally {
    setAccessToken(null);
  }
};

export const me = (): Promise<User> => apiRequest<User>('/auth/me');
