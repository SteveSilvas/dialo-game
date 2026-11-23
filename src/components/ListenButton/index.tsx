import { useAtom } from 'jotai';
import { TiVolume } from 'react-icons/ti';
import { getSpeechStatus, speak } from '../../utils/speech';
import { soundAtom } from '../../Context/SoundAtom';
import './index.css';

type ListenButtonProps = {
  /** Texto pronunciado ao tocar. */
  text: string;
};

/**
 * Botão de ouvir o enunciado das atividades que dependem de som.
 *
 * Fica sempre visível: repetir o som é a ação principal de quem está resolvendo,
 * e esconder isso atrás de um gesto extra atrapalha justamente quem tem mais
 * dificuldade. Com o som do jogo desligado, tocar aqui religa o áudio em vez de
 * ficar inerte — nessas atividades a fala é o exercício, não ambiência.
 */
const ListenButton = ({ text }: ListenButtonProps) => {
  const speechAvailable = getSpeechStatus() === 'available';
  const [sound, setSound] = useAtom(soundAtom);

  const replay = () => {
    if (!sound.isActive) setSound({ isActive: true });
    speak(text);
  };

  return (
    <button
      type="button"
      className="listen-button"
      onClick={replay}
      aria-label={speechAvailable ? `Ouvir: ${text}` : 'Som indisponível neste aparelho'}
      disabled={!speechAvailable}
    >
      <TiVolume aria-hidden="true" className="listen-button__icon" />
      <span>
        {!speechAvailable
          ? 'SOM INDISPONÍVEL'
          : sound.isActive
            ? 'OUVIR DE NOVO'
            : 'ATIVAR SOM E OUVIR'}
      </span>
    </button>
  );
};

export default ListenButton;
