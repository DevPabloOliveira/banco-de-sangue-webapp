// tests/jest.setup.cjs
const mysql = require('mysql2/promise');
require('dotenv/config');          // ← carrega .env


// cria o pool **antes** da primeira suíte
beforeAll(async () => {
  global.testDbPool = await mysql.createPool({
    host:     process.env.DB_HOST      ?? 'localhost',
    user:     process.env.DB_USER      ?? 'root',
    password: process.env.DB_PASS      ?? '',
    database: process.env.DB_NAME_TEST ?? 'banco_sangue_test',
    waitForConnections: true,
  });
});

// limpa tabelas antes de cada teste de integração
beforeEach(async () => {
  await global.testDbPool.query('DELETE FROM bolsas_sangue');
  await global.testDbPool.query('DELETE FROM doadores');
  // adicione outras tabelas se precisar
});

// encerra o pool no fim de tudo
afterAll(async () => {
  await global.testDbPool.end();
});
