/**
 * @jest-environment jsdom
 */

/**
 * Fluxos “tristes” – scripts/empresa.js
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';

fetchMock.enableMocks();

const step  = () => new Promise(setImmediate);
const flush = async (n = 80) => { while (n--) await step(); };

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

    ({ window } = mount());
    document    = window.document;

    global.window   = window;
    global.document = document;
    global.location = window.location;
    global.fetch    = window.fetch = fetchMock;

    // carrega o script alvo DEPOIS de setar os mocks
    require('../../scripts/empresa.js');
  });

  it('consulta /auth-status apenas uma vez quando não autenticado', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    window.dispatchEvent  (new window.Event('load'));
    await flush();

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(fetchMock.mock.calls.some(([u]) => u.includes('/auth-status'))).toBe(true);
  });

  it('exibe “Nenhum doador…” se /buscar-bolsa-sangue retorna lista vazia', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))
      .mockResponseOnce(JSON.stringify({ success: true, doadores: [] }));

    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    window.dispatchEvent  (new window.Event('load'));
    await flush();

    document.getElementById('form-busca-bolsa')
            .dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

 expect(document.getElementById('resultado-bolsa').textContent.toLowerCase())
   .toContain('nenhum doador');
  });
});
