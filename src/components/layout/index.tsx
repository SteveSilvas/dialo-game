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
      void audioRef.current.play();
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
