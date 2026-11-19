import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { sessionAtom, isAuthenticated } from '../../state/session';

/**
 * Atalho de conta na home. Mostra o nome de quem entrou e, para o convidado,
 * o convite a criar conta — que é o que permite levar o progresso a outro
 * aparelho.
 */
const AccountBadge = () => {
  const session = useAtomValue(sessionAtom);

  if (session.status === 'loading') return null;

  if (isAuthenticated(session)) {
    return (
      <p className="account-badge" role="status">
        Olá, {session.user?.displayName ?? session.user?.username}
      </p>
    );
  }

  return (
    <Link className="account-badge" to="/entrar">
      Entrar ou criar conta
    </Link>
  );
};

export default AccountBadge;
