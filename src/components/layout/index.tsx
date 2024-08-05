import { Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { soundAtom } from "../../Context/SoundAtom";
import { useAtom } from "jotai";
import SoundPlayer from "../SoundPlayer";
import arquivoAudio from "../../assets/soudMr.mp3";
const Layout = () => {
  const audioRef = useRef(new Audio(arquivoAudio));
  const [sound] = useAtom(soundAtom);

  useEffect(() => {
    if (sound.isActive) {
      audioRef.current.src = sound.src;
      audioRef.current.play();
      console.log();
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Opcional: Reinicia o áudio
    }
  }, [sound]);

  return (
    <>
      <SoundPlayer />
      <Outlet />
    </>
  );
};

export default Layout;
