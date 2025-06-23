/**
 * @jest-environment jsdom
 *
 * Fluxos felizes – scripts/funcionario.js
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';

fetchMock.enableMocks();
const step  = () => new Promise(setImmediate);
const flush = async (n = 100) => { while (n--) await step(); };

describe('funcionario.js – fluxos felizes', () => {
  let window, document;

  const mountDOM = () => new JSDOM(`
    <!DOCTYPE html><body>
      <!-- busca doador -->
      <form id="form-busca-doador"><input name="query" value="Ana"></form>
      <div id="resultado-busca-doador"></div>

      <!-- add insumo -->
      <form id="form-add-insumo">
        <input name="nome"       value="Seringa">
        <input name="quantidade" value="5">
      </form>
      <div id="mensagem-sucesso" style="display:none"></div>
      <div id="mensagem-erro"    style="display:none"></div>
    </body>`,
    { url: 'http://localhost/funcionario' }
  );

  beforeEach(() => {
    jest.resetModules();
    fetchMock.resetMocks();

    ({ window }  = mountDOM());
    document      = window.document;

    global.window   = window;
    global.document = document;
    global.location = window.location;
    global.fetch    = window.fetch = fetchMock;

    require('../../scripts/funcionario.js');
  });

  const fireReady = async () => {
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flush();
    window.dispatchEvent(new window.Event('load'));
    await flush();
  };

  it('busca doador e preenche resultado', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated:true }))
      .mockResponseOnce(JSON.stringify({
        success:true,
        doadores:[{ name:'Ana', tipo_sangue:'A+' }]
      }));

    await fireReady();

    document.getElementById('form-busca-doador')
            .dispatchEvent(new window.Event('submit', { bubbles:true }));
    await flush();

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(fetchMock.mock.calls.some(([u]) => u.includes('/buscar-doador'))).toBe(true);
    expect(document.getElementById('resultado-busca-doador').textContent).toMatch(/Ana/i);
  });

  it('insere insumo com sucesso e mostra mensagem', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated:true }))
      .mockResponseOnce(JSON.stringify({ success:true }));

    await fireReady();

    document.getElementById('form-add-insumo')
            .dispatchEvent(new window.Event('submit', { bubbles:true }));
    await flush();

    expect(document.getElementById('mensagem-sucesso').style.display).not.toBe('none');
    expect(document.getElementById('mensagem-erro').style.display).toBe('none');
  });
});
