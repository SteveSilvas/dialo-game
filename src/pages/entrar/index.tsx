import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TiArrowLeftThick } from 'react-icons/ti';
import CustomButton from '../../components/Button';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { login, loginWithGoogle, register } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useSession } from '../../hooks/useSession';
import type { User } from '../../api/types';
import {
  validateEmail,
  validateIdentifier,
  validateLoginPassword,
  validatePassword,
  validateUsername,
  type FieldError,
} from '../../utils/authValidation';
import './index.css';

type Mode = 'login' | 'register';

type Errors = {
  identifier?: FieldError;
  username?: FieldError;
  email?: FieldError;
  password?: FieldError;
};

/**
 * Entrada e cadastro na mesma tela: a criança pode jogar sem conta, então esta
 * página é opcional e nunca bloqueia a trilha.
 */
const Entrar = () => {
  const navigate = useNavigate();
  const { signIn } = useSession();

  const [mode, setMode] = useState<Mode>('login');
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  /** Valida um campo isolado; campo vazio só é cobrado no envio. */
  const validateField = useCallback(
    (field: keyof Errors, value: string): FieldError => {
      switch (field) {
        case 'identifier':
          return validateIdentifier(value);
        case 'username':
          return validateUsername(value);
        case 'email':
          return validateEmail(value);
        case 'password':
          return isRegister ? validatePassword(value) : validateLoginPassword(value);
      }
    },
    [isRegister],
  );

  const handleBlur = (field: keyof Errors, value: string) => {
    if (!value) return;
    setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
  };

  const handleChange = (field: keyof Errors, value: string) => {
    // Depois de um erro visível, a correção aparece enquanto a criança digita.
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: validateField(field, value) }));
    }
  };

  const validateAll = (): Errors =>
    isRegister
      ? {
          username: validateUsername(username),
          email: validateEmail(email),
          password: validatePassword(password),
        }
      : {
          identifier: validateIdentifier(identifier),
          password: validateLoginPassword(password),
        };

  const applySession = async (user: User) => {
    await signIn(user);
    navigate('/trilha', { replace: true });
  };

  const describeFailure = (caught: unknown): string => {
    if (caught instanceof ApiError) {
      return caught.isOffline
        ? 'Não foi possível falar com o servidor. Verifique sua conexão.'
        : caught.message;
    }
    return 'Algo deu errado. Tente novamente.';
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);

    const found = validateAll();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSubmitting(true);

    try {
      const data = isRegister
        ? await register({ username, email, password })
        : await login({ identifier, password });

      await applySession(data.user);
    } catch (caught) {
      setError(describeFailure(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (idToken: string) => {
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const data = await loginWithGoogle(idToken);
      await applySession(data.user);
    } catch (caught) {
      setError(describeFailure(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError(null);
    setErrors({});
  };

  return (
    <main className="page px-4 py-4 gap-3">
      <h1 className="text-lg sm:text-2xl md:text-3xl text-center">
        {isRegister ? 'CRIAR CONTA' : 'ENTRAR'}
      </h1>
      <p className="text-center text-sm sm:text-base px-2">
        {isRegister
          ? 'A conta guarda o progresso da criança em qualquer aparelho.'
          : 'Entre para continuar de onde parou.'}
      </p>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        {isRegister ? (
          <>
            <label htmlFor="username">Nome de usuário</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                handleChange('username', event.target.value);
              }}
              onBlur={(event) => handleBlur('username', event.target.value)}
              minLength={3}
              maxLength={20}
              aria-invalid={errors.username ? true : undefined}
              aria-describedby={errors.username ? 'username-error' : undefined}
              required
            />
            {errors.username && (
              <p className="login-error" id="username-error">
                {errors.username}
              </p>
            )}

            <label htmlFor="email">Email (opcional)</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                handleChange('email', event.target.value);
              }}
              onBlur={(event) => handleBlur('email', event.target.value)}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p className="login-error" id="email-error">
                {errors.email}
              </p>
            )}
          </>
        ) : (
          <>
            <label htmlFor="identifier">Usuário ou email</label>
            <input
              id="identifier"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                handleChange('identifier', event.target.value);
              }}
              onBlur={(event) => handleBlur('identifier', event.target.value)}
              aria-invalid={errors.identifier ? true : undefined}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
              required
            />
            {errors.identifier && (
              <p className="login-error" id="identifier-error">
                {errors.identifier}
              </p>
            )}
          </>
        )}

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            handleChange('password', event.target.value);
          }}
          onBlur={(event) => handleBlur('password', event.target.value)}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          required
        />
        {errors.password && (
          <p className="login-error" id="password-error">
            {errors.password}
          </p>
        )}

        {isRegister && (
          <p className="login-hint">
            A senha precisa ter ao menos 8 caracteres e não pode ser só números.
          </p>
        )}

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'ENVIANDO...' : isRegister ? 'CRIAR CONTA' : 'ENTRAR'}
        </button>
      </form>

      <GoogleSignInButton onCredential={handleGoogleCredential} disabled={submitting} />

      <button type="button" className="login-switch" onClick={switchMode}>
        {isRegister ? 'Já tenho conta' : 'Criar uma conta'}
      </button>

      <Link className="login-guest" to="/trilha">
        Continuar sem conta
      </Link>

      <CustomButton
        href="/"
        text="VOLTAR"
        leftIcon={
          <TiArrowLeftThick
            style={{ left: '0.5rem', fontSize: '3rem', color: 'var(--ink)' }}
          />
        }
      />
    </main>
  );
};

export default Entrar;
