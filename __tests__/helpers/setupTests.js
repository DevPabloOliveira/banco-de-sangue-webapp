/**
 * Arquivo de *setup* executado antes de **todas** as suites.
 * - Polyfill de `setImmediate` (JSDOM/Node 18+)  
 * - Mock + limpeza do `console.error`
 */

/* ---------------------------------------------------------------- *\
 * 1️⃣  Polyfill: JSDOM (e Node 18+) não expõem global.setImmediate
\* ---------------------------------------------------------------- */
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (cb, ...args) => setTimeout(cb, 0, ...args);
}

/* ---------------------------------------------------------------- *\
 * 2️⃣  Espiona console.error para evitar poluição no output de teste
\* ---------------------------------------------------------------- */
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

/* ---------------------------------------------------------------- *\
 * 3️⃣  Limpa chamadas a cada teste  (mas **não** falha automaticamente –
 *     ver comentários abaixo)
\* ---------------------------------------------------------------- */
afterEach(() => {
  console.error.mockClear();
});

/* ---------------------------------------------------------------- *\
 * 4️⃣  Restaura implementação original ao final de tudo
\* ---------------------------------------------------------------- */
afterAll(() => {
  console.error.mockRestore();
});

/**
 * ️ℹ️  Se você quiser que **qualquer** chamada inesperada a console.error
 *      quebre o teste automaticamente, basta adicionar no início do seu
 *      teste (o(s) que espera(m) erro) algo como:
 *
 *        expect.assertions(1);           // opcional
 *        console.error.mockImplementation(() => {});  // já existe
 *
 *      …e no fim do teste:
 *
 *        expect(console.error).toHaveBeenCalled();
 *
 *      Assim mantemos a verificação controlada, sem afetar todos os outros
 *      cenários.
 */
