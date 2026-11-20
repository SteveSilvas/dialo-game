import { useEffect, useRef, useState } from 'react';
import { ENV_GOOGLE_CLIENT_ID } from '../../api/env';

/**
 * Subconjunto da API do Google Identity Services que usamos. O script é
 * carregado em tempo de execução, então os tipos vêm daqui em vez de uma
 * dependência `@types` só para isso.
 */
type GoogleCredentialResponse = { credential?: string };

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: string;
          theme?: string;
          size?: string;
          text?: string;
          locale?: string;
          width?: number;
        },
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SCRIPT_ID = 'google-identity-services';
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

/** Uma promise por documento: montar a tela duas vezes não baixa o script duas vezes. */
let scriptPromise: Promise<void> | null = null;

const loadScript = (): Promise<void> => {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('google-script')));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('google-script')));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

type GoogleSignInButtonProps = {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
};

/**
 * Botão oficial do Google. Renderiza nada quando não há client id configurado,
 * o que mantém o cadastro por senha funcionando em ambientes sem Google — e
 * evita um botão que só falharia no clique.
 */
const GoogleSignInButton = ({ onCredential, disabled = false }: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  // O callback do Google é registrado uma vez; a ref evita recriar o botão a
  // cada render quando o pai passa uma função nova. A atualização fica em
  // efeito porque escrever na ref durante o render é impuro.
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!ENV_GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    void (async () => {
      try {
        await loadScript();
        if (cancelled) return;

        const google = window.google;
        const container = containerRef.current;
        if (!google?.accounts?.id || !container) return;

        google.accounts.id.initialize({
          client_id: ENV_GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) onCredentialRef.current(response.credential);
          },
        });

        container.replaceChildren();
        google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          locale: 'pt-BR',
          width: 320,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ENV_GOOGLE_CLIENT_ID) return null;

  if (failed) {
    return (
      <p className="login-hint login-google-fallback">
        O botão do Google não carregou. Entre com usuário e senha.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="login-google"
      data-disabled={disabled || undefined}
      aria-busy={disabled || undefined}
    />
  );
};

export default GoogleSignInButton;
