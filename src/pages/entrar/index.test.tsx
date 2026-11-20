import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'jotai';
import Entrar from './index';
import { setAccessToken } from '../../api/client';

const fetchMock = jest.fn();
const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(body),
});

const renderPage = () =>
  render(
    <Provider>
      <MemoryRouter>
        <Entrar />
      </MemoryRouter>
    </Provider>,
  );

beforeEach(() => {
  setAccessToken(null);
  fetchMock.mockReset();
  (globalThis as { fetch?: unknown }).fetch = fetchMock;
  localStorage.clear();
});

describe('página de entrada', () => {
  it('começa no modo de login e oferece continuar sem conta', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'ENTRAR' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continuar sem conta' }),
    ).toHaveAttribute('href', '/trilha');
  });

  it('alterna para o cadastro e mostra os campos extras', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Criar uma conta' }));

    expect(screen.getByRole('heading', { name: 'CRIAR CONTA' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nome de usuário')).toBeInTheDocument();
    expect(screen.getByLabelText('Email (opcional)')).toBeInTheDocument();
  });

  it('entra com usuário e senha e guarda o token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        accessToken: 'token-123',
        user: { id: '1', username: 'bia', displayName: 'Bia' },
      }),
    );

    renderPage();

    await userEvent.type(screen.getByLabelText('Usuário ou email'), 'bia');
    await userEvent.type(screen.getByLabelText('Senha'), 'SenhaForte123');
    await userEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('mostra a mensagem do servidor quando a senha está errada', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ detail: 'Usuário ou senha inválidos.' }, 401),
    );

    renderPage();

    await userEvent.type(screen.getByLabelText('Usuário ou email'), 'bia');
    await userEvent.type(screen.getByLabelText('Senha'), 'errada');
    await userEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Usuário ou senha inválidos.',
    );
  });

  it('avisa quando o servidor está fora do ar', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    renderPage();

    await userEvent.type(screen.getByLabelText('Usuário ou email'), 'bia');
    await userEvent.type(screen.getByLabelText('Senha'), 'SenhaForte123');
    await userEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível falar com o servidor',
    );
  });

  it('não chama a API quando os campos estão vazios', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('Digite seu usuário ou e-mail.')).toBeInTheDocument();
    expect(screen.getByText('Digite sua senha.')).toBeInTheDocument();
  });

  it('aponta o campo com erro para leitor de tela', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));

    const identifier = screen.getByLabelText('Usuário ou email');
    expect(identifier).toHaveAttribute('aria-invalid', 'true');
    expect(identifier).toHaveAttribute('aria-describedby', 'identifier-error');
    expect(document.getElementById('identifier-error')).toHaveTextContent(
      'Digite seu usuário ou e-mail.',
    );
  });

  it('valida o cadastro antes de enviar', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Criar uma conta' }));
    await userEvent.type(screen.getByLabelText('Nome de usuário'), 'ab');
    await userEvent.type(screen.getByLabelText('Email (opcional)'), 'sem-arroba');
    await userEvent.type(screen.getByLabelText('Senha'), '12345678');
    await userEvent.click(screen.getByRole('button', { name: 'CRIAR CONTA' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText('O nome precisa ter ao menos 3 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Confira o e-mail: falta o @ ou o domínio.')).toBeInTheDocument();
    expect(screen.getByText('A senha não pode ser só números.')).toBeInTheDocument();
  });

  it('limpa o erro do campo assim que a criança corrige', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'ENTRAR' }));
    expect(screen.getByText('Digite seu usuário ou e-mail.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Usuário ou email'), 'b');

    expect(
      screen.queryByText('Digite seu usuário ou e-mail.'),
    ).not.toBeInTheDocument();
  });

  it('aceita cadastro válido e envia os dados', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        accessToken: 'token-abc',
        user: { id: '2', username: 'bia', displayName: 'Bia' },
      }),
    );

    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Criar uma conta' }));
    await userEvent.type(screen.getByLabelText('Nome de usuário'), 'bia');
    await userEvent.type(screen.getByLabelText('Senha'), 'SenhaForte123');
    await userEvent.click(screen.getByRole('button', { name: 'CRIAR CONTA' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('esconde o botão do Google quando não há client id', () => {
    const { container } = renderPage();

    expect(container.querySelector('.login-google')).toBeNull();
  });
});
