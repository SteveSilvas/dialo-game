import logo from './assets/logo_orange.png';
import './App.css';
import arquivoAudio from './assets/soudMr.mp3';
import CustomButton from './components/Button';
import { TiMediaPlay } from 'react-icons/ti';
import { useAtom } from 'jotai';
import { soundAtom } from './Context/SoundAtom';
import {  useRef } from 'react';
function App() {
  const audioRef = useRef(new Audio(arquivoAudio));
  const [, setSound] = useAtom(soundAtom);

  const handleStartSound = () => {
    setSound({
      name: 'sound',
      src: audioRef.current.src,
      isActive: true,
    });
  };

  return (
    <main
      className="page"
    >
      <div>
        <a
          href="https://steve.infotecdevs.com.br"
          target="_blank">
          <img src={logo} className="logo" alt="logo" />
        </a>
      </div>

      <h1>VAMOS APRENDER?</h1>
      <div className="card" >
        <CustomButton
          text="INICIAR"
          href="/modulo-01"
          onClick={handleStartSound}
          rightIcon={
            <TiMediaPlay
              style={{
                fontSize: '3rem',
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
