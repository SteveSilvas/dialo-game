import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BACKGROUND_MUSIC_SOURCES } from './backgroundMusic';

const AUDIO_BUDGET_BYTES = 700_000;

describe('BACKGROUND_MUSIC_SOURCES', () => {
  it('oferece Opus como primeira opção e MP3 como fallback', () => {
    expect(BACKGROUND_MUSIC_SOURCES).toHaveLength(2);
    expect(BACKGROUND_MUSIC_SOURCES[0].type).toBe('audio/ogg; codecs=opus');
    expect(BACKGROUND_MUSIC_SOURCES[1].type).toBe('audio/mpeg');
  });

  it('serve os arquivos de public/, fora do bundle JS', () => {
    for (const source of BACKGROUND_MUSIC_SOURCES) {
      expect(source.src).toMatch(/^\/audio\//);
    }
  });

  it.each(BACKGROUND_MUSIC_SOURCES)(
    'mantém $src abaixo de 700 kB',
    ({ src }) => {
      const filePath = join(process.cwd(), 'public', src);
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeLessThan(AUDIO_BUDGET_BYTES);
    },
  );
});
