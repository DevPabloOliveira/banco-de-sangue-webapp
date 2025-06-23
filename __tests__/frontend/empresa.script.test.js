/* === __tests__/frontend/empresa.script.test.js (CORRIGIDO) === */

/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Habilita o mock global para a função fetch
fetchMock.enableMocks();

// Utilitário para aguardar que todas as promises pendentes sejam resolvidas
const flushPromises = () => new Promise(setImmediate);

// Carrega o conteúdo do script que queremos testar
const empresaScript = fs.readFileSync(
  path.resolve(__dirname, '../../scripts/empresa.js'),
  'utf8'
);

describe('scripts/empresa.js', () => {
  let document;
  let window;

  beforeEach(() => {
    jest.resetModules(); 
    // Reseta os mocks antes de cada teste para garantir isolamento
    fetchMock.resetMocks();
    
    // Cria um ambiente JSDOM limpo para cada teste
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="btn-logout"></button>
          <a class="auth-only"></a>
        </body>
      </html>
    `, { url: 'http://localhost/empresa' });

    window = dom.window;
    document = dom.window.document;

    // CORREÇÃO PRINCIPAL: Substituímos o window.location por um mock controlável
    // para evitar erros de configuração e permitir a verificação do redirecionamento.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: dom.window.location.href, assign: jest.fn() },
    });
    
    // Injeta o script no nosso DOM simulado
    const scriptEl = document.createElement('script');
    scriptEl.textContent = empresaScript;
    document.body.appendChild(scriptEl);
    /* liga o DOM recém-criado ao escopo global que o script enxerga */
    global.window   = window;
    global.document = document;
    global.location = window.location;
    /* garante que fetch global é o mesmo mock */
    global.fetch = fetchMock;

    // carrega o script _depois_ de setar os globals
    require('../../scripts/empresa.js');
  });

  it('deve redirecionar para / quando o usuário não está autenticado', async () => {
    // Simula a resposta da API dizendo que o usuário não está logado
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: false }));

    // Dispara o evento que o script está esperando
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    
    // Aguarda a execução da lógica assíncrona (fetch)
    await flushPromises();

    // Verifica se a função de redirecionamento foi chamada com o caminho correto
    expect(window.location.assign).toHaveBeenCalledWith('/');
  });

  it('deve chamar /sair e redirecionar ao clicar no botão de logout', async () => {
    // Simula a resposta de que o usuário está logado
    fetchMock.mockResponseOnce(JSON.stringify({ isAuthenticated: true }));
    // Simula a resposta vazia da chamada de logout
    fetchMock.mockResponseOnce('');

    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flushPromises(); // Espera o fetch de status inicial

    // Simula o clique do usuário no botão de logout
    document.getElementById('btn-logout').click();
    await flushPromises(); // Espera o fetch de logout

  expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  expect(fetchMock.mock.calls.some(([u]) => u === '/sair')).toBe(true);
    
    // Verifica se o redirecionamento foi chamado com o caminho correto
    expect(window.location.assign).toHaveBeenCalledWith('/');
  });
});