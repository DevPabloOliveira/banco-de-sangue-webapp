/**
 * @jest-environment jsdom
 */

/**
 * Fluxos “tristes” – scripts/funcionario.js
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';

fetchMock.enableMocks();

const step  = () => new Promise(setImmediate);
const flush = async (n = 80) => { while (n--) await step(); };

describe('scripts/funcionario.js – fluxos de erro', () => {
  let window, document;

  const mount = () => new JSDOM(`
    <!DOCTYPE html><body>
      <!-- busca doador -->
      <form id="form-busca-doador"><input name="query" value="Zé"></form>
      <div id="buscar-doador"><a id="aviso" style="display:none"></a></div>
      <div id="resultado-busca-doador"></div>

      <!-- add insumo -->
      <form id="form-add-insumo">
        <input name="nome" value="Seringa">
        <input name="quantidade" value="5">
      </form>
      <div id="mensagem-sucesso" style="display:none"></div>
      <div id="mensagem-erro"    style="display:none"></div>
    </body>`, { url: 'http://localhost/funcionario' });

  beforeEach(() => {
    jest.resetModules();
    fetchMock.resetMocks();

    ({ window } = mount());
    document    = window.document;

    global.window   = window;
    global.document = document;
    global.location = window.location;
    global.fetch    = window.fetch = fetchMock;

    require('../../scripts/funcionario.js');
  });

  it('mostra aviso se /buscar-doador devolve lista vazia', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))  // /auth-status
      .mockResponseOnce(JSON.stringify({ success: true, doadores: [] })); // /buscar-doador

    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    window.dispatchEvent  (new window.Event('load'));
    await flush();

    document.getElementById('form-busca-doador')
            .dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    expect(document.querySelector('#buscar-doador #aviso').style.display).not.toBe('none');
  });

  it('exibe mensagemErro se /add-insumo devolve success:false', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))          // /auth-status
      .mockResponseOnce(JSON.stringify({ success: false, message: 'erro' })); // /add-insumo

    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    window.dispatchEvent  (new window.Event('load'));
    await flush();

    document.getElementById('form-add-insumo')
            .dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    expect(document.getElementById('mensagem-erro').style.display)
      .not.toBe('none');
  });
});
