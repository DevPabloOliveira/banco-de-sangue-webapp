/* === __tests__/frontend/funcionario.script.test.js (CORRIGIDO) === */

/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const flushPromises = () => new Promise(setImmediate);

const html = /* html */`
  <form id="form-busca-doador"><input name="query" value="Ana" /></form>
  <div id="resultado-busca-doador"></div>
  <span id="buscar-doador"><span id="aviso" style="display:none"></span></span>
`;

describe('scripts/funcionario.js', () => {
  let dom, window, document;

  // Helper to load and execute the script within the JSDOM window context.
  const loadAndRunScript = () => {
    const scriptPath = path.resolve(__dirname, '../../scripts/funcionario.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const scriptEl = document.createElement('script');
    scriptEl.textContent = scriptContent;
    document.body.appendChild(scriptEl);
  };


  beforeEach(() => {
    fetchMock.resetMocks();
    jest.resetModules();

    dom = new JSDOM(html, { url: 'http://localhost/funcionario' });
    window = dom.window;
    document = window.document;

    // Aplica a mesma correção do mock de location aqui.
    delete window.location;
    window.location = { href: 'http://localhost/funcionario' };

    global.window = window;
    global.document = document;
    global.location = window.location;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('redireciona p/ / se não autenticado', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    loadAndRunScript();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flushPromises();

    expect(window.location.href).toBe('/');
  });

  it('preenche resultado ao buscar doador', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))
      .mockResponseOnce(
        JSON.stringify({ success: true, doadores: [{ name: 'Ana', tipo_sangue: 'A+' }] })
      );

    loadAndRunScript();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flushPromises();

    const form = document.getElementById('form-busca-doador');
    form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();

    expect(fetchMock.mock.calls.length).toBe(2);
    expect(fetchMock.mock.calls[0][0]).toBe('/auth-status');
    expect(fetchMock.mock.calls[1][0]).toContain('/buscar-doador?query=Ana');
    
    expect(
      document.getElementById('resultado-busca-doador').textContent
    ).toContain('Ana');
  });
});
