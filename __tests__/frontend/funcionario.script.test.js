/* === __tests__/frontend/funcionario.script.test.js (ATUALIZADO) === */

/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// --- Configuração global do fetch mock ---
fetchMock.enableMocks();
const flushPromises = () => new Promise(setImmediate);

// carrega o script original
const funcionarioScript = fs.readFileSync(
  path.resolve(__dirname, '../../scripts/funcionario.js'),
  'utf8'
);

describe('scripts/funcionario.js', () => {
  let document;
  let window;

  beforeEach(() => {
    jest.resetModules();          // esvazia cache do require
    fetchMock.resetMocks();       // limpa chamadas anteriores

    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="form-busca-doador"><input name="query" value="Ana" /></form>
          <div id="resultado-busca-doador"></div>
          <div id="buscar-doador"><div id="aviso" style="display:none"></div></div>
        </body>
      </html>
    `, { url: 'http://localhost/funcionario' });

    window   = dom.window;
    document = dom.window.document;

    // mock de location.assign para verificação
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: dom.window.location.href, assign: jest.fn() },
    });

    // expõe DOM + fetch no escopo global antes do require
    global.window   = window;
    global.document = document;
    global.location = window.location;
    global.fetch    = fetchMock;

    // injeta o arquivo de script (necessário p/ JSDOM)
    const scriptEl = document.createElement('script');
    scriptEl.textContent = funcionarioScript;
    document.body.appendChild(scriptEl);
    require('../../scripts/funcionario.js');
  });

  it('deve redirecionar para / se não estiver autenticado', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flushPromises();

    expect(window.location.assign).toHaveBeenCalledWith('/');
  });

  it('deve preencher o resultado ao buscar um doador com sucesso', async () => {
    // 1ª resposta → status de autenticação
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: true }));
    // 2ª resposta → resultado da busca
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, doadores: [{ name: 'Ana', tipo_sangue: 'A+' }] })
    );

    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flushPromises();   // aguarda /auth-status

    // dispara submit
    const form = document.getElementById('form-busca-doador');
    form.dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flushPromises();   // aguarda /buscar-doador

    /* ─────────── Asserções ─────────── */

    // pelo menos dois fetches (status + busca) – pode haver 4
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);

    // deve existir chamada para a rota de busca esperada
    const houveBusca = fetchMock.mock.calls.some(
      ([url]) => url.includes('/buscar-doador?query=Ana')
    );
    expect(houveBusca).toBe(true);

    // DOM atualizado com resultado
    const resultadoDiv = document.getElementById('resultado-busca-doador');
    expect(resultadoDiv.textContent)
      .toContain('Nome: Ana, Tipo Sanguíneo: A+');
  });
});
