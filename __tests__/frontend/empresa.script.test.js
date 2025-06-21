/* === __tests__/frontend/empresa.script.test.js (CORRIGIDO) === */

/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Utility to wait for the promise queue to be empty
const flushPromises = () => new Promise(setImmediate);

const html = /* html */`
  <button id="btn-logout"></button>
  <a class="auth-only"></a>
`;

describe('scripts/empresa.js', () => {
  let dom, window, document;

  // Helper to load and execute the script within the JSDOM window context.
  const loadAndRunScript = () => {
    const scriptPath = path.resolve(__dirname, '../../scripts/empresa.js');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    // Appending a script tag is the most browser-like way to execute it in JSDOM
    const scriptEl = document.createElement('script');
    scriptEl.textContent = scriptContent;
    document.body.appendChild(scriptEl);
  };

  beforeEach(() => {
    fetchMock.resetMocks(); 
    jest.resetModules();

    dom = new JSDOM(html, { url: 'http://localhost/empresa' });
    window = dom.window;
    document = window.document;

    // **A CORREÇÃO PRINCIPAL**: Substituímos o objeto location por um mock controlável.
    // Isso evita o erro "not declared configurable".
    delete window.location;
    window.location = { href: 'http://localhost/empresa' };

    global.window = window;
    global.document = document;
    global.location = window.location;
    global.fetch = fetchMock;
  });

  afterEach(() => {
    dom.window.close();
  });

  it('redireciona p/ / quando não autenticado', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    loadAndRunScript();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flushPromises();

    // Agora podemos verificar diretamente o valor da propriedade href no nosso mock.
    expect(window.location.href).toBe('/');
  });

  it('logout chama /sair e redireciona', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))
      .mockResponseOnce('');

    loadAndRunScript();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flushPromises();

    document.getElementById('btn-logout').click();
    await flushPromises();

    // Verifica a segunda chamada fetch.
    expect(fetchMock.mock.calls.length).toBe(2);
    expect(fetchMock.mock.calls[1][0]).toBe('/sair');

    // Verifica o redirecionamento após o logout.
    expect(window.location.href).toBe('/');
  });
});
