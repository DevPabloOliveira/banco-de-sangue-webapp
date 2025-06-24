/**
 * @jest-environment jsdom
 *
 * __tests__/frontend/empresa.error.script.test.js
 * Exercita os "caminhos tristes" do script da empresa.
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';
import { bootstrap } from '../../scripts/empresa.js'; // Ajuste: Importa o bootstrap

fetchMock.enableMocks();

const flush = () => new Promise(setImmediate);

describe('scripts/empresa.js – fluxos de erro', () => {
  let window, document;

  const mount = () => new JSDOM(`
    <!DOCTYPE html><body>
      <form id="form-busca-bolsa">
        <select name="tipo_sangue"><option value="o-">O-</option></select>
      </form>
      <div id="resultado-bolsa"></div>
    </body>`, { url: 'http://localhost/empresa' });

  beforeEach(() => {
    jest.resetModules();
    fetchMock.resetMocks();

    const dom = mount();
    window = dom.window;
    document = dom.window.document;

    // Mock para a função de redirecionamento
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: dom.window.location.href, assign: jest.fn() },
    });

    global.window = window;
    global.document = document;
    global.location = window.location;
    global.fetch = window.fetch = fetchMock;
  });

  it('deve redirecionar se a autenticação falhar', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    // Chama o bootstrap, que deve falhar e redirecionar
    await bootstrap();
    await flush();

    // Verifica se a chamada de autenticação foi feita
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toContain('/auth-status');

    // Verifica se o redirecionamento ocorreu
    expect(window.location.assign).toHaveBeenCalledWith('/');
  });

  it('exibe “Nenhum doador…” se /buscar-bolsa-sangue retorna lista vazia', async () => {
    // 1. Mock para auth OK
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: true }));
    // 2. Mock para busca retornar vazio
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, doadores: [] }));

    await bootstrap();
    await flush();

    document.getElementById('form-busca-bolsa').dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    // Verifica se a div de resultado contém a mensagem de erro
    const resultado = document.getElementById('resultado-bolsa');
    expect(resultado.textContent.toLowerCase()).toContain('nenhum doador');
  });
});