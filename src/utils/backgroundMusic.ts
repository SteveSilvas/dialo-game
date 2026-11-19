export interface AudioSource {
  src: string;
  type: string;
}

/**
 * Música de fundo servida de `public/audio`, fora do bundle JS. O Opus vem
 * primeiro por ser bem menor; o MP3 cobre navegadores sem Ogg/Opus.
 */
export const BACKGROUND_MUSIC_SOURCES: AudioSource[] = [
  { src: '/audio/fundo.ogg', type: 'audio/ogg; codecs=opus' },
  { src: '/audio/fundo.mp3', type: 'audio/mpeg' },
];
