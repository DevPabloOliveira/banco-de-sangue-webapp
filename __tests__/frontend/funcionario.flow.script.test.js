/**
 * @jest-environment jsdom
 *
 * __tests__/frontend/funcionario.flow.script.test.js
 * Exercita os "caminhos felizes" do script do funcionário.
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';
import { bootstrap } from '../../scripts/funcionario.js'; // Ajuste: Importa o bootstrap

fetchMock.enableMocks();

// Utilitário para aguardar a resolução de promises na fila de microtasks
const flush = () => new Promise(setImmediate);

describe('funcionario.js – fluxos felizes', () => {
  let window, document;

  // Cria um DOM novo para cada teste
  const mountDOM = () => new JSDOM(`
    <!DOCTYPE html><body>
      <form id="form-busca-doador"><input name="query" value="Ana"></form>
      <div id="resultado-busca-doador"></div>
      <div id="buscar-doador"><div id="aviso" style="display:none"></div></div>

      <form id="form-add-insumo">
        <input name="nome" value="Seringa">
        <input name="quantidade" value="5">
      </form>
      <div id="mensagem-sucesso" style="display:none"></div>
      <div id="mensagem-erro" style="display:none"></div>
    </body>`,
    { url: 'http://localhost/funcionario' }
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

  it('busca doador e preenche resultado', async () => {
    // Mock para autenticação bem-sucedida e para a busca de doador
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))
      .mockResponseOnce(JSON.stringify({
        success: true,
        doadores: [{ name: 'Ana', tipo_sangue: 'A+' }]
      }));

    // Ajuste: Roda a inicialização do script manualmente
    await bootstrap();
    await flush(); // Espera o fetch de auth

    // Dispara a submissão do formulário
    document.getElementById('form-busca-doador').dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush(); // Espera o fetch da busca

    // Verifica se as duas chamadas de fetch ocorreram e se o DOM foi atualizado
    expect(fetchMock.mock.calls.length).toBe(2);
    expect(fetchMock.mock.calls[1][0]).toContain('/buscar-doador');
    expect(document.getElementById('resultado-busca-doador').textContent).toMatch(/Ana/i);
  });

  it('insere insumo com sucesso e mostra mensagem', async () => {
    // Mock para autenticação e para a adição do insumo
    fetchMock
      .mockResponseOnce(JSON.stringify({ isAuthenticated: true }))
      .mockResponseOnce(JSON.stringify({ success: true }));

    // Roda a inicialização do script
    await bootstrap();
    await flush();

    // Dispara a submissão do formulário
    document.getElementById('form-add-insumo').dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flush();

    // Verifica se a mensagem de sucesso está visível e a de erro, oculta
    expect(document.getElementById('mensagem-sucesso').style.display).not.toBe('none');
    expect(document.getElementById('mensagem-erro').style.display).toBe('none');
  });
});