/**
 * @jest-environment jsdom
 */
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

beforeEach(() => {
  fetch.resetMocks();
  document.body.innerHTML = `
     <button id="btn-logout"></button>
     <a class="auth-only"></a>
  `;
 require('../../scripts/auth.js');          // importa DEPOIS do DOM
});

it('mostra logout quando autenticado', async () => {
  fetch.mockResponseOnce(JSON.stringify({ isAuthenticated: true }));

 document.dispatchEvent(new Event('DOMContentLoaded'));  // dispara handler
  await new Promise(setImmediate);                        // espera .then()
  expect(document.getElementById('btn-logout').style.display)
    .toBe('inline-block');
});
