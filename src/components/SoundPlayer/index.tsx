// SoundPlayer.js
import { useAtom } from "jotai";
import { soundAtom } from "../../Context/SoundAtom";
import CustomButton from "../Button";
import "./styles.css";
import { TiNotes, TiVolumeMute } from "react-icons/ti";
const SoundPlayer = () => {
  const [sound, setSound] = useAtom(soundAtom);

  const handleStopSound = () => {
    setSound({
      ...sound,
      isActive: false,
    });
  };

  const handleStartSound = () => {
    setSound({
      ...sound,
      isActive: true,
    });
  };

  return (
    <CustomButton
      leftIcon={
        sound.isActive ? (
          <TiVolumeMute onClick={handleStopSound} className="icon-sound" />
        ) : (
          <TiNotes onClick={handleStartSound} className="icon-sound" />
        )
      }
      className="button-sound"

    />
  );
};

export default SoundPlayer;
