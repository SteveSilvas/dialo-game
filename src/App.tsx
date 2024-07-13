import logo from './assets/logo.png';
import './App.css';
import arquivoAudio from './assets/soudMr.mp3';
import CustomButton from './components/Button';
import { TiMediaPlay } from 'react-icons/ti';

function App() {
  var novoAudio = new Audio(arquivoAudio);

  return (
    <main
      onLoad={() => novoAudio.play()}
      className="page"
    >
      <div>
        <a
          href="https://vitejs.dev"
          target="_blank">
          <img src={logo} className="logo" alt="logo" />
        </a>
      </div>

      <h1>VAMOS APRENDER?</h1>
      <div className="card" >
        <CustomButton
          text="INICIAR"
          href="/modulo-01"
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
