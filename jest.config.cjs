/**
 * Configuração do Jest para um projeto Vite + React + TypeScript (ESM).
 *
 * O projeto usa `"type": "module"`, então os módulos de teste são compilados
 * para CommonJS pelo ts-jest. Assets (CSS, imagens, áudio) são substituídos
 * por stubs via moduleNameMapper, já que o Jest não entende os imports do Vite.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/test/styleMock.ts',
    '\\.(png|jpe?g|gif|svg|webp|ico)$': '<rootDir>/test/fileMock.ts',
    '\\.(mp3|wav|ogg|m4a|mp4)$': '<rootDir>/test/fileMock.ts',
  },
  // O jotai publica apenas ESM; precisa ser transpilado para CommonJS no Jest.
  transformIgnorePatterns: ['/node_modules/(?!jotai/)'],
  transform: {
    '^.+\\.js$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
        diagnostics: { warnOnly: true },
      },
    ],
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
        diagnostics: { warnOnly: true },
      },
    ],
  },
};
