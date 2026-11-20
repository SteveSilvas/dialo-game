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

  it('relata o resultado uma única vez, mesmo clicando depois de concluir', () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useActivityProgress(buildOptions, isValid, onFinish),
    );

    act(() => {
      result.current.selectOption('A');
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith({
      bestScore: 1,
      attempts: 1,
      errors: 0,
    });

    // A grade continua na tela: um erro depois da conclusão não pode gerar um
    // segundo relatório, que sujaria a melhor tentativa já salva.
    act(() => {
      result.current.selectOption('B');
    });

    expect(result.current.errors).toBe(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('relata de novo depois de reiniciar a atividade', () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() =>
      useActivityProgress(buildOptions, isValid, onFinish),
    );

    act(() => {
      result.current.selectOption('A');
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.reset();
    });
    act(() => {
      result.current.selectOption('A');
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onFinish).toHaveBeenCalledTimes(2);
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

  it('remove o símbolo na hora quando o sistema pede movimento reduzido', () => {
    const matchMedia = jest.fn().mockReturnValue({ matches: true });
    window.matchMedia = matchMedia as unknown as typeof window.matchMedia;

    try {
      const { result } = setup();

      act(() => {
        result.current.selectOption('A');
      });

      // Sem esperar a animação: ela é quase instantânea nesse modo.
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current.options).toEqual(['B', 'C']);
      expect(result.current.optionsFound).toEqual(['A']);
    } finally {
      // @ts-expect-error volta ao jsdom sem matchMedia para os outros testes.
      delete window.matchMedia;
    }
  });
});
