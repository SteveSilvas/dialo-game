import { useAtom } from "jotai";
import { soundAtom } from "../../Context/SoundAtom";
import CustomButton from "../Button";
import "./styles.css";
import { TiNotes, TiVolumeMute } from "react-icons/ti";

const SoundPlayer = () => {
  const [sound, setSound] = useAtom(soundAtom);

  const toggleSound = () => {
    setSound({ isActive: !sound.isActive });
  };

  return (
    <CustomButton
      leftIcon={
        sound.isActive ? (
          <TiVolumeMute onClick={toggleSound} className="icon-sound" />
        ) : (
          <TiNotes onClick={toggleSound} className="icon-sound" />
        )
      }
      className="button-sound"
    />
  );
};

export default SoundPlayer;
