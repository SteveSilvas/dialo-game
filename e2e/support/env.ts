/**
 * Endereços usados pelo E2E. Ficam em um módulo próprio para que o
 * `playwright.config.ts` (que sobe os servidores) e os testes leiam o mesmo
 * valor — inclusive quando a porta é trocada por variável de ambiente em uma
 * máquina onde a padrão já está ocupada.
 */
const readPort = (name: string, fallback: number): number => {
  const raw = process.env[name];
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const API_PORT = readPort('DIALO_E2E_API_PORT', 5098);
export const WEB_PORT = readPort('DIALO_E2E_WEB_PORT', 4173);

/**
 * `localhost` (e não `127.0.0.1`) nos dois lados: o cookie de refresh é
 * `SameSite=Lax`, e só é enviado em requisições que o navegador considera do
 * mesmo site — o que exige o mesmo host, não só a mesma máquina.
 */
export const API_URL = `http://localhost:${API_PORT}`;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
