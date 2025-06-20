// executa antes de todos os testes
import mysql from 'mysql2/promise';

// Fornece um pool global para que cada teste possa importar
global.testDbPool = await mysql.createPool({
  host:     process.env.DB_HOST     ?? 'localhost',
  user:     process.env.DB_USER     ?? 'root',
  password: process.env.DB_PASS     ?? '',
  database: process.env.DB_NAME_TEST ?? 'banco_sangue_test',
  waitForConnections: true,
});

// Zerar tabelas antes de cada teste de integração
beforeEach(async () => {
  await global.testDbPool.query('DELETE FROM bolsas_sangue');
  await global.testDbPool.query('DELETE FROM doadores');
  /* adicione outras tabelas se necessário */
});

afterAll(async () => {
  await global.testDbPool.end();
});
