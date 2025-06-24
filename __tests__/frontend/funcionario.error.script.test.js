/**
 * @jest-environment jsdom
 *
 * __tests__/frontend/funcionario.error.script.test.js
 * Exercita os "caminhos tristes" do script do funcionário.
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';
import { bootstrap } from '../../scripts/funcionario.js'; // Ajuste: Importa o bootstrap

fetchMock.enableMocks();

const flush = () => new Promise(setImmediate);

describe('scripts/funcionario.js – fluxos de erro', () => {
  let window, document;

  const mount = () => new JSDOM(`
    <!DOCTYPE html><body>
      <form id="form-busca-doador"><input name="query" value="Zé"></form>
      <div id="buscar-doador"><div id="aviso" style="display:none"></div></div>
      <div id="resultado-busca-doador"></div>

      <form id="form-add-insumo">
        <input name="nome" value="Seringa"><input name="quantidade" value="5">
      </form>
      <div id="mensagem-sucesso" style="display:none"></div>
      <div id="mensagem-erro" style="display:none"></div>
    </body>`, { url: 'http://localhost/funcionario' });

  beforeEach(() => {
    jest.resetModules();
    fetchMock.resetMocks();

    const dom = mount();
    window = dom.window;
    document = dom.window.document;

    // Ajuste: Adiciona o mock de location para todos os testes neste arquivo
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: dom.window.location.href, assign: jest.fn() },
    });

    global.window = window;
    global.document = document;
    global.location = window.location;
    global.fetch = window.fetch = fetchMock;
  });

  it('mostra aviso se /buscar-doador devolve lista vazia', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true })) // 1. Auth OK
      .mockResponseOnce(JSON.stringify({ success: true, doadores: [] })); // 2. Busca retorna vazio

    await bootstrap();
    await flush();

    document.getElementById('form-busca-doador').dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    const aviso = document.querySelector('#buscar-doador #aviso');
    expect(aviso.style.display).not.toBe('none');
  });

  it('exibe mensagemErro se /add-insumo devolve success:false', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true })) // 1. Auth OK
      .mockResponseOnce(JSON.stringify({ success: false, message: 'erro' }), { status: 400 }); // 2. Add falha

    await bootstrap();
    await flush();

    document.getElementById('form-add-insumo').dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    const mensagemErro = document.getElementById('mensagem-erro');
    expect(mensagemErro.style.display).not.toBe('none');
  });
});