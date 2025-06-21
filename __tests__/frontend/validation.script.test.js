/**
 * @jest-environment jsdom
 *
 * __tests__/frontend/validation.script.test.js
 * ------------------------------------------------------------------
 * Exercita scripts/validation.js
 *  – impede submit quando as senhas não batem
 *  – deixa passar quando estão corretas
 * ------------------------------------------------------------------
 */

import { jest } from '@jest/globals';

/* ------------------------------------------------------------------ *
 * Utilitário para criar o DOM mínimo que o script precisa
 * ------------------------------------------------------------------ */
function buildDOM() {
  document.body.innerHTML = `
    <div id="modal-cadastro">
      <form id="form-cadastro">
        <input type="password" id="password"          value="">
        <input type="password" id="confirm-password"  value="">
        <button type="submit">Enviar</button>
      </form>
      <span id="message" style="display:none"></span>
    </div>
  `;
}

/* ------------------------------------------------------------------ *
 * 1) Antes de **cada** teste: recria DOM limpo e força reload do script
 * ------------------------------------------------------------------ */
beforeEach(() => {
  jest.resetModules();   // garante novo import do validation.js
  buildDOM();
});

/* ------------------------------------------------------------------ *
 * 2) Senhas diferentes  →  preventDefault chamado + mensagem visível
 * ------------------------------------------------------------------ */
it('exibe aviso e impede submit quando senhas diferem', async () => {
  // carrega o script (ele registra o handler no form)
  await import('../../scripts/validation.js');

  // dispara DOMContentLoaded para acionar o listener
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await new Promise(setImmediate);          // espera event-loop

  // preenche campos de senha *diferentes*
  document.getElementById('password').value         = 'abc123';
  document.getElementById('confirm-password').value = 'xyz789';

  // cria evento “fake” com spy em preventDefault
  const evt = new Event('submit');
  evt.preventDefault = jest.fn();

  // dispara submit
  document.getElementById('form-cadastro').dispatchEvent(evt);

  // asserções
  expect(evt.preventDefault).toHaveBeenCalled();

  const msg = document.getElementById('message');
  expect(msg.style.display).toBe('block');
  expect(msg.textContent).toBe('As senhas não correspondem.');
});

/* ------------------------------------------------------------------ *
 * 3) Senhas iguais  →  submit segue normalmente, sem aviso
 * ------------------------------------------------------------------ */
it('permite submit quando senhas coincidem', async () => {
  await import('../../scripts/validation.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await new Promise(setImmediate);

  // preenche campos com mesma senha
  document.getElementById('password').value         = 'abc123';
  document.getElementById('confirm-password').value = 'abc123';

  const evt = new Event('submit');
  evt.preventDefault = jest.fn();

  document.getElementById('form-cadastro').dispatchEvent(evt);

  // não deve ter bloqueado o submit
  expect(evt.preventDefault).not.toHaveBeenCalled();

  const msg = document.getElementById('message');
  expect(msg.style.display).toBe('none');
});
