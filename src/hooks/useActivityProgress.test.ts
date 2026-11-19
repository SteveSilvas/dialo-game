import { act, renderHook } from '@testing-library/react';
import { useActivityProgress } from './useActivityProgress';

jest.mock('../utils/sounds', () => ({ playSound: jest.fn() }));

const buildOptions = () => ['A', 'B', 'C'];
const isValid = (option: string) => option === 'A';

const setup = () =>
  renderHook(() => useActivityProgress(buildOptions, isValid));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('useActivityProgress', () => {
  it('remove o símbolo correto depois da animação de saída', () => {
    const { result } = setup();

    act(() => {
      result.current.selectOption('A');
    });
    expect(result.current.removing).toEqual(['A']);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.options).toEqual(['B', 'C']);
    expect(result.current.optionsFound).toEqual(['A']);
    expect(result.current.removing).toEqual([]);
  });

  it('conta erro e mantém as opções quando o símbolo não é válido', () => {
    const { result } = setup();

    act(() => {
      result.current.selectOption('B');
    });

    expect(result.current.errors).toBe(1);
    expect(result.current.clicksCount).toBe(1);
    expect(result.current.options).toEqual(['A', 'B', 'C']);
  });

  it('não deixa o timer pendente remover um símbolo do novo sorteio', () => {
    const { result } = setup();

    act(() => {
      result.current.selectOption('A');
    });

    // Reinicia antes dos 1000 ms da animação de saída.
    act(() => {
      result.current.reset();
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(result.current.options).toEqual(['A', 'B', 'C']);
    expect(result.current.optionsFound).toEqual([]);
    expect(result.current.removing).toEqual([]);
  });

  it('marca finish quando todos os símbolos válidos foram encontrados', () => {
    const { result } = setup();

    act(() => {
      result.current.selectOption('A');
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.finish).toBe(true);
  });

  it('remove os dois itens quando o segundo é clicado antes do primeiro sair', () => {
    const { result } = renderHook(() =>
      useActivityProgress(buildOptions, (option) => option !== 'C'),
    );

    act(() => {
      result.current.selectOption('A');
    });
    act(() => {
      result.current.selectOption('B');
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(result.current.options).toEqual(['C']);
    expect(result.current.optionsFound).toEqual(['A', 'B']);
  });

  it('conta o acerto uma única vez em clique duplo no mesmo item', () => {
    const { result } = setup();

    act(() => {
      result.current.selectOption('A');
    });
    act(() => {
      result.current.selectOption('A');
    });

    act(() => {
      jest.advanceTimersByTime(1200);
    });

    expect(result.current.optionsFound).toEqual(['A']);
    expect(result.current.clicksCount).toBe(1);
  });

  it('limpa o timer ao desmontar', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    const { result, unmount } = setup();

    act(() => {
      result.current.selectOption('A');
    });
    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
