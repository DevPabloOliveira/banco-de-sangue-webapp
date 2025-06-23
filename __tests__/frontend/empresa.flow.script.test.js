/**
 * @jest-environment jsdom
 *
 * Fluxos felizes – scripts/empresa.js
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';

fetchMock.enableMocks();
const step  = () => new Promise(setImmediate);
const flush = async (n = 100) => { while (n--) await step(); };

describe('empresa.js – fluxos felizes', () => {
  let window, document;

  const mountDOM = () => new JSDOM(`
    <!DOCTYPE html><body>
      <!-- busca bolsa -->
      <form id="form-busca-bolsa">
        <select name="tipo_sangue"><option value="a+" selected>A+</option></select>
      </form>
      <div id="resultado-bolsa"></div>

      <!-- add bolsa -->
      <form id="form-add-bolsa">
        <select name="tipo_sangue"><option value="a+" selected>A+</option></select>
        <input  name="quantidade" value="4">
      </form>
      <div id="msg-ok"  style="display:none"></div>
      <div id="msg-err" style="display:none"></div>
    </body>`,
    { url: 'http://localhost/empresa' }
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

    require('../../scripts/empresa.js');          // importa o script alvo
  });

  const fireReady = async () => {
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flush();
    window.dispatchEvent(new window.Event('load'));
    await flush();
  };

  it('faz auth, busca bolsas e preenche resultado', async () => {
    /* mocks: auth + busca */
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated:true }))
      .mockResponseOnce(JSON.stringify({
        success:true,
        doadores:[{ name:'Ana', tipo_sangue:'A+' }]
      }));

    await fireReady();

    /* submete o form de busca */
    document.getElementById('form-busca-bolsa')
            .dispatchEvent(new window.Event('submit', { bubbles:true }));
    await flush();

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(fetchMock.mock.calls.some(([u]) => u.includes('/buscar-bolsa-sangue'))).toBe(true);
    expect(document.getElementById('resultado-bolsa').textContent).toMatch(/Ana/i);
  });

  it('exibe msg-ok e limpa form após add-bolsa bem-sucedido', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated:true }))
      .mockResponseOnce(JSON.stringify({ success:true }));

    await fireReady();

    const form = document.getElementById('form-add-bolsa');
    form.reset = jest.fn();

    form.dispatchEvent(new window.Event('submit', { bubbles:true }));
    await flush();

    expect(document.getElementById('msg-ok').style.display).not.toBe('none');
    expect(form.reset).toHaveBeenCalled();
  });
});
