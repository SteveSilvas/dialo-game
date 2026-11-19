import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai';
import SoundPlayer from './index';

describe('SoundPlayer', () => {
  it('alterna o som pelo teclado e expõe o estado em aria-pressed', async () => {
    render(
      <Provider>
        <SoundPlayer />
      </Provider>,
    );

    const botao = screen.getByRole('button', { name: 'Ativar som' });
    expect(botao).toHaveAttribute('aria-pressed', 'false');

    await userEvent.tab();
    expect(botao).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    const pausar = screen.getByRole('button', { name: 'Pausar som' });
    expect(pausar).toHaveAttribute('aria-pressed', 'true');

    await userEvent.keyboard(' ');

    expect(screen.getByRole('button', { name: 'Ativar som' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
