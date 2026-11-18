import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// jsdom não fornece TextEncoder/TextDecoder, exigidos pelo react-router-dom.
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
  globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

// O jsdom não implementa HTMLMediaElement.play; stub evita erros nos testes.
beforeAll(() => {
  Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: jest.fn(),
  });
});
