import logo from './assets/logo_orange.png';
import './App.css';
import CustomButton from './components/Button';
import { TiMediaPlay } from 'react-icons/ti';
import { useAtom } from 'jotai';
import { soundAtom } from './Context/SoundAtom';

function App() {
  const [, setSound] = useAtom(soundAtom);

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
      <div className="card">
        <CustomButton
          text="INICIAR"
          href="/modulo-01"
          onClick={handleStartSound}
          className="text-base sm:text-lg"
          rightIcon={
            <TiMediaPlay
              className="text-3xl sm:text-4xl md:text-5xl"
              style={{
                color: 'var(--infantil-6)'
              }}
            />
          }
        />
      </div>
    </main>
  )
}

export default App
