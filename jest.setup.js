// jest.setup.js
// ------------------------------------------------------------------
// 1️⃣  Variáveis de ambiente usadas somente nos testes
// ------------------------------------------------------------------
process.env.NODE_ENV    = 'test';              // evita subir o servidor
process.env.DB_DATABASE = 'banco_sangue_test'; // pool de conexão “fake”

// ------------------------------------------------------------------
// 2️⃣  Polyfills que o JSDOM (ou Node) podem não expor
// ------------------------------------------------------------------

// 2.1 setImmediate – JSDOM / Node ≥18 não o expõem por padrão
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

// 2.2 TextEncoder / TextDecoder – exigido por whatwg-url (usado pelo jsdom)
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;

// ------------------------------------------------------------------
// 3️⃣  Mock global de fetch (para testes de front-end)
// ------------------------------------------------------------------
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
global.fetch = fetchMock; // garante ser o mesmo em qualquer lugar

// ------------------------------------------------------------------
// 4️⃣  Espiona console.error para não poluir a saída
// ------------------------------------------------------------------
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => { /* silenciado */ });
});

// ------------------------------------------------------------------
// 5️⃣  Limpa mocks depois de CADA teste
// ------------------------------------------------------------------
afterEach(() => {
  jest.clearAllMocks();   // restaura chamadas & contadores
  fetchMock.resetMocks(); // evita state-leak entre testes
  console.error.mockClear();
});

// ------------------------------------------------------------------
// 6️⃣  Restaura console.error original quando tudo termina
// ------------------------------------------------------------------
afterAll(() => {
  console.error.mockRestore();
});
