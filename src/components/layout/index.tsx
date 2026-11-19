import { Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { soundAtom } from "../../Context/SoundAtom";
import SoundPlayer from "../SoundPlayer";
import { BACKGROUND_MUSIC_SOURCES } from "../../utils/backgroundMusic";
import { useSessionRestore } from "../../hooks/useSession";

const Layout = () => {
  // Restaura o login uma única vez, aqui: todas as páginas ficam dentro dele.
  useSessionRestore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [sound] = useAtom(soundAtom);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (sound.isActive) {
      // O play só acontece depois do gesto em "INICIAR"; se o navegador
      // bloquear, o botão de som continua disponível para nova tentativa.
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [sound.isActive]);

  return (
    <>
      <SoundPlayer />
      <audio ref={audioRef} loop preload="none">
        {BACKGROUND_MUSIC_SOURCES.map(({ src, type }) => (
          <source key={src} src={src} type={type} />
        ))}
      </audio>
      <Outlet />
    </>
  );
};

export default Layout;
