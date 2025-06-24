/* === __tests__/frontend/empresa.script.test.js (AJUSTADO) === */

/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';

// AJUSTE: O bootstrap é importado diretamente para ser chamado nos testes.
import { bootstrap } from '../../scripts/empresa.js';

// Habilita o mock global para a função fetch
fetchMock.enableMocks();

// Utilitário para aguardar que todas as promises pendentes sejam resolvidas
const flushPromises = () => new Promise(setImmediate);

describe('scripts/empresa.js', () => {
  let document;
  let window;

  beforeEach(() => {
    jest.resetModules();
    // Reseta os mocks antes de cada teste para garantir isolamento
    fetchMock.resetMocks();

    // Cria um ambiente JSDOM limpo para cada teste
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="btn-logout"></button>
          <a class="auth-only"></a>
        </body>
      </html>
    `, { url: 'http://localhost/empresa' });

    window = dom.window;
    document = dom.window.document;

    // Substituímos o window.location por um mock controlável
    // para permitir a verificação do redirecionamento.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: dom.window.location.href, assign: jest.fn() },
    });

    // liga o DOM recém-criado ao escopo global que o script enxerga
    global.window = window;
    global.document = document;
    global.location = window.location;
    // garante que fetch global é o mesmo mock
    global.fetch = fetchMock;
  });

  it('deve redirecionar para / quando o usuário não está autenticado', async () => {
    // Simula a resposta da API dizendo que o usuário não está logado
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    // AJUSTE: Chama a função de inicialização diretamente em vez de disparar um evento.
    await bootstrap();

    // Aguarda a execução da lógica assíncrona (fetch e o catch)
    await flushPromises();

    // Verifica se a função de redirecionamento foi chamada com o caminho correto
    expect(window.location.assign).toHaveBeenCalledWith('/');
  });

  it('deve chamar /sair e redirecionar ao clicar no botão de logout', async () => {
    // 1. Simula a resposta de que o usuário está logado para o bootstrap passar
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: true }));
    // 2. Simula a resposta da chamada de logout que ocorrerá após o clique
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }));

    // Executa a inicialização do script (que adiciona o listener de clique)
    await bootstrap();
    await flushPromises(); // Garante que a verificação de auth terminou

    // Simula o clique do usuário no botão de logout
    document.getElementById('btn-logout').click();
    await flushPromises(); // Espera o fetch de logout

    // Verifica se a chamada fetch para /sair foi feita
    const sairCall = fetchMock.mock.calls.find(call => call[0].includes('/sair'));
    expect(sairCall).toBeDefined();

    // Verifica se o redirecionamento foi chamado com o caminho correto
    expect(window.location.assign).toHaveBeenCalledWith('/');
  });
});