/**
 * Validação de formulário do front. Espelha as regras de `AuthContracts` e de
 * `PasswordPolicy` na API, que continua sendo a autoridade: aqui o objetivo é
 * avisar antes do envio, não substituir a checagem do servidor.
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mesma lista de `PasswordPolicy.CommonPasswords` na API. Sem ela, uma senha
 * comum passava na validação da tela e só era recusada no servidor, com a
 * mensagem genérica de política em vez do campo apontando o problema.
 */
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'senha123', 'password', 'password1',
  'qwertyui', 'qwerty123', 'abc12345', '11111111', '00000000', 'iloveyou',
  'admin123', 'letmein1', 'welcome1', 'monkey12', 'dragon12', 'football',
  'brasil123', 'flamengo', 'corinthians', 'palmeiras', 'aaaaaaaa', 'asdfghjk',
]);

export type FieldError = string | null;

export const validateUsername = (value: string): FieldError => {
  const trimmed = value.trim();
  if (!trimmed) return 'Escolha um nome de usuário.';
  if (trimmed.length < USERNAME_MIN)
    return `O nome precisa ter ao menos ${USERNAME_MIN} caracteres.`;
  if (trimmed.length > USERNAME_MAX)
    return `O nome pode ter no máximo ${USERNAME_MAX} caracteres.`;
  if (!USERNAME_PATTERN.test(trimmed))
    return 'Use apenas letras, números e _ (underline).';
  return null;
};

/** O e-mail é opcional no cadastro: vazio é válido. */
export const validateEmail = (value: string): FieldError => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 254) return 'Esse e-mail é longo demais.';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Confira o e-mail: falta o @ ou o domínio.';
  return null;
};

export const validateIdentifier = (value: string): FieldError =>
  value.trim() ? null : 'Digite seu usuário ou e-mail.';

export const validatePassword = (value: string): FieldError => {
  if (!value) return 'Digite uma senha.';
  if (value.length < PASSWORD_MIN)
    return `A senha precisa ter ao menos ${PASSWORD_MIN} caracteres.`;
  if (value.length > PASSWORD_MAX)
    return `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`;
  if (/^\d+$/.test(value)) return 'A senha não pode ser só números.';
  if (new Set(value).size === 1) return 'A senha não pode ser um caractere repetido.';
  if (COMMON_PASSWORDS.has(value.toLowerCase()))
    return 'Essa senha é comum demais. Escolha outra.';
  return null;
};

/** Senha de login só precisa estar preenchida: as regras são do cadastro. */
export const validateLoginPassword = (value: string): FieldError =>
  value ? null : 'Digite sua senha.';
