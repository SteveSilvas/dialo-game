import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAtom, useAtomValue } from 'jotai';
import { TiMediaPlay } from 'react-icons/ti';
import logo from './assets/logo_orange.png';
import './App.css';
import CustomButton from './components/Button';
import AccountBadge from './components/AccountBadge';
import ProgressSummaryPanel from './components/ProgressSummary';
import { soundAtom } from './Context/SoundAtom';
import { useCatalog } from './hooks/useCatalog';
import { isAuthenticated, sessionAtom } from './state/session';
import { TRAIL_PATH, resumeTarget, summarizeProgress } from './utils/progress';

function App() {
  const [, setSound] = useAtom(soundAtom);
  const session = useAtomValue(sessionAtom);
  const authenticated = isAuthenticated(session);
  const { modules, status } = useCatalog();

  const summary = useMemo(() => summarizeProgress(modules), [modules]);
  const resume = useMemo(() => resumeTarget(modules), [modules]);

  // Quem já concluiu alguma atividade volta em "CONTINUAR"; quem abre o jogo
  // pela primeira vez vê "INICIAR". Sem atividade pendente, o alvo é a trilha.
  const started = summary.activitiesCompleted > 0;
  const allDone = started && resume?.replay === true;

  const primaryText = allDone ? 'JOGAR DE NOVO' : started ? 'CONTINUAR' : 'INICIAR';
  // Quem ainda não jogou nada entra pela trilha: pular direto para a primeira
  // atividade esconde o mapa e o módulo onde a criança está.
  const primaryHref = started && resume ? resume.href : TRAIL_PATH;

  const handleStartSound = () => {
    setSound({ isActive: true });
  };

  return (
    <main className="page">
      <div>
        <a
          href="https://github.com/SteveSilvas/dialo-game"
          target="_blank"
          rel="noreferrer">
          <img src={logo} className="logo" alt="DIALO GAME" />
        </a>
      </div>

      <h1 className="text-xl sm:text-2xl md:text-3xl px-4">VAMOS APRENDER?</h1>
      <AccountBadge />

      {status === 'ready' && <ProgressSummaryPanel summary={summary} />}

      <div className="card home-actions">
        <CustomButton
          text={primaryText}
          href={primaryHref}
          onClick={handleStartSound}
          className="text-base sm:text-lg"
          rightIcon={
            <TiMediaPlay
              className="text-3xl sm:text-4xl md:text-5xl"
              style={{
                color: 'var(--ink)'
              }}
            />
          }
        />

        {started && resume && (
          <p className="home-hint" role="status">
            {allDone
              ? 'Você concluiu tudo! Pode rever as atividades quando quiser.'
              : `Você parou em ${resume.activityTitle.toUpperCase()}`}
          </p>
        )}

        <Link className="button" to={TRAIL_PATH}>
          VER A TRILHA
        </Link>

        {!authenticated && session.status !== 'loading' && (
          <p className="home-guest">
            Você joga como visitante: o progresso fica neste aparelho. Com uma
            conta, ele vai junto para qualquer um.
          </p>
        )}
      </div>
    </main>
  )
}

export default App
