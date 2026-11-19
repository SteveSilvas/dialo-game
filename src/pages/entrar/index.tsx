import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TiArrowLeftThick } from 'react-icons/ti';
import CustomButton from '../../components/Button';
import { login, register } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useSession } from '../../hooks/useSession';
import './index.css';

type Mode = 'login' | 'register';

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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const data = isRegister
        ? await register({ username, email, password })
        : await login({ identifier, password });

      await signIn(data.user);
      navigate('/modulo-01', { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(
          caught.isOffline
            ? 'Não foi possível falar com o servidor. Verifique sua conexão.'
            : caught.message,
        );
      } else {
        setError('Algo deu errado. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
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
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              required
            />

            <label htmlFor="email">Email (opcional)</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </>
        ) : (
          <>
            <label htmlFor="identifier">Usuário ou email</label>
            <input
              id="identifier"
              name="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </>
        )}

        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

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

      <button
        type="button"
        className="login-switch"
        onClick={() => {
          setMode(isRegister ? 'login' : 'register');
          setError(null);
        }}>
        {isRegister ? 'Já tenho conta' : 'Criar uma conta'}
      </button>

      <Link className="login-guest" to="/modulo-01">
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
