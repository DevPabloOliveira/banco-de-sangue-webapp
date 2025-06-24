/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';
import { bootstrap } from '../../scripts/funcionario.js'; // Ajuste: Importa o bootstrap

fetchMock.enableMocks();
const flushPromises = () => new Promise(setImmediate);

describe('scripts/funcionario.js', () => {
  let document;
  let window;

  beforeEach(() => {
    jest.resetModules();
    fetchMock.resetMocks();

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

    window = dom.window;
    document = dom.window.document;

    // Mock do window.location para testar redirecionamentos
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: dom.window.location.href, assign: jest.fn() },
    });

    // Expõe o ambiente JSDOM para o escopo global
    global.window = window;
    global.document = document;
    global.location = window.location;
    global.fetch = fetchMock;
  });

  it('deve redirecionar para / se não estiver autenticado', async () => {
    // Simula a API retornando que o usuário não está logado
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    // Ajuste: Chama a função de inicialização diretamente
    await bootstrap();
    await flushPromises();

    // Verifica se o redirecionamento foi tentado
    expect(window.location.assign).toHaveBeenCalledWith('/');
  });

  it('deve preencher o resultado ao buscar um doador com sucesso', async () => {
    // 1ª resposta → autenticação bem-sucedida
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: true }));
    // 2ª resposta → resultado da busca
    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, doadores: [{ name: 'Ana', tipo_sangue: 'A+' }] })
    );

    // Roda a inicialização para registrar os listeners
    await bootstrap();
    await flushPromises();

    // Dispara a submissão do formulário
    const form = document.getElementById('form-busca-doador');
    form.dispatchEvent(new window.Event('submit', { bubbles: true }));
    await flushPromises();

    // Verifica se a chamada à API foi feita corretamente
    const houveBusca = fetchMock.mock.calls.some(
      ([url]) => url.includes('/buscar-doador?query=Ana')
    );
    expect(houveBusca).toBe(true);

    // Verifica se o DOM foi atualizado com o resultado
    const resultadoDiv = document.getElementById('resultado-busca-doador');
    expect(resultadoDiv.textContent).toContain('Nome: Ana, Tipo: A+');
  });
});