import { useAtom } from "jotai";
import { soundAtom } from "../../Context/SoundAtom";
import CustomButton from "../Button";
import "./styles.css";
import { TiNotes, TiVolumeMute } from "react-icons/ti";

const SoundPlayer = () => {
  const [sound, setSound] = useAtom(soundAtom);

  const handleToggleSound = () => {
    setSound({
      ...sound,
      isActive: !sound.isActive,
    });
  };

  return (
    <CustomButton
      onClick={handleToggleSound}
      ariaLabel={sound.isActive ? "Pausar som" : "Ativar som"}
      ariaPressed={sound.isActive}
      leftIcon={
        sound.isActive ? (
          <TiVolumeMute className="icon-sound" />
        ) : (
          <TiNotes className="icon-sound" />
        )
      }
      className="button-sound"
    />
  );
};

export default SoundPlayer;
