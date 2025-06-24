/**
 * @jest-environment jsdom
 *
 * __tests__/frontend/empresa.flow.script.test.js
 * Exercita os "caminhos felizes" do script da empresa.
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';
import { bootstrap } from '../../scripts/empresa.js'; // Ajuste: Importa o bootstrap

fetchMock.enableMocks();

const flush = () => new Promise(setImmediate);

describe('empresa.js – fluxos felizes', () => {
  let window, document;

  const mountDOM = () => new JSDOM(`
    <!DOCTYPE html><body>
      <form id="form-busca-bolsa">
        <select name="tipo_sangue"><option value="a+" selected>A+</option></select>
      </form>
      <div id="resultado-bolsa"></div>

      <form id="form-add-bolsa">
        <select name="tipo_sangue"><option value="a+" selected>A+</option></select>
        <input name="quantidade" value="4">
      </form>
      <div id="msg-ok" style="display:none"></div>
      <div id="msg-erro" style="display:none"></div>
    </body>`,
    { url: 'http://localhost/empresa' }
  );

  beforeEach(() => {
    jest.resetModules();
    fetchMock.resetMocks();

    const dom = mountDOM();
    window = dom.window;
    document = dom.window.document;

    global.window = window;
    global.document = document;
    global.location = window.location;
    global.fetch = window.fetch = fetchMock;
  });

  it('faz auth, busca bolsas e preenche resultado', async () => {
    // Mock para auth e para a busca
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))
      .mockResponseOnce(JSON.stringify({
        success: true,
        doadores: [{ name: 'Ana', tipo_sangue: 'A+' }]
      }));

    // Roda a inicialização do script
    await bootstrap();
    await flush();

    // Submete o formulário de busca
    document.getElementById('form-busca-bolsa').dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    // Verifica se as duas chamadas ocorreram e o DOM foi atualizado
    expect(fetchMock.mock.calls.length).toBe(2);
    expect(fetchMock.mock.calls[1][0]).toContain('/buscar-bolsa-sangue');
    expect(document.getElementById('resultado-bolsa').textContent).toMatch(/Ana/i);
  });

  it('exibe msg-ok e limpa form após add-bolsa bem-sucedido', async () => {
    // Mock para auth e para a adição
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))
      .mockResponseOnce(JSON.stringify({ success: true }));

    await bootstrap();
    await flush();

    const form = document.getElementById('form-add-bolsa');
    form.reset = jest.fn(); // Cria um mock para a função reset

    form.dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    expect(document.getElementById('msg-ok').style.display).not.toBe('none');
    expect(form.reset).toHaveBeenCalled();
  });
});