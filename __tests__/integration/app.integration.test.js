/**
 * __tests__/integration/app.integration.test.js
 */

import request        from 'supertest';
import { jest }       from '@jest/globals';
import bcrypt         from 'bcrypt';
import app            from '../../app.js';
import { connection } from '../../db/connection.js';

/* ─────────────────────────  Credenciais  ───────────────────────── */
const admin = { email: 'admin.test@empresa.com', password: 'admin-123' };
const func  = { email: 'func@test.com',  password: 'func-123' };

let adminHash, funcHash;
let agent;          // mantém sessão entre requisições
let querySpy;       // mock global de connection.query

/* ────────────────────────  Boot global  ────────────────────────── */
beforeAll(async () => {
  adminHash = await bcrypt.hash(admin.password, 10);
  funcHash  = await bcrypt.hash(func.password, 10);

  /* 1) mock da pool de consultas ---------------------------------- */
  querySpy = jest
    .spyOn(connection, 'query')
    .mockImplementation(async (sql, params = []) => {

      // login – tabela users
      if (/FROM\s+users\s+WHERE\s+email/i.test(sql)) {
        if (params[0] === admin.email)
          return [[{ id: 1, password: adminHash }]];
        return [[]];
      }

      // login – tabela funcionarios
      if (/FROM\s+funcionarios\s+WHERE\s+email/i.test(sql)) {
        if (params[0] === func.email)
          return [[{ id: 2, cargo: 'estoque', password: funcHash }]];
        return [[]];
      }

      // INSERT genérico
      if (/^\s*insert/i.test(sql))
        return [[{ insertId: 999 }]];

      return [[]];
    });

  /* 2) garante connection.end ------------------------------------- */
  if (!connection.end) {
    connection.end = jest.fn().mockResolvedValue();
  }
});

/* ───────────────────── Hooks por-teste ─────────────────────────── */
beforeEach(async () => {
  agent = request.agent(app);
  await agent.post('/entrar').send(admin);     // “loga” admin
});

afterEach(() => {
  /* mantemos spies/stubs globais, limpamos só chamadas */
  jest.clearAllMocks();
});

afterAll(async () => {
  querySpy.mockRestore();
  await connection.end();                      // nunca quebra
});

/* ─────────────────────────  Testes  ────────────────────────────── */
describe('Rotas públicas', () => {
  it('GET / responde 200',           () => request(app).get('/').expect(200));
  it('GET /recuperacao responde 200', () => request(app).get('/recuperacao').expect(200));
});

describe('Autenticação', () => {
  it('POST /cadastrar devolve 302 se faltar campo obrigatório', () =>
    request(app).post('/cadastrar').send({ name: 'Só nome' }).expect(302));

  it('POST /entrar loga funcionário e redireciona', async () => {
    // “cria” funcionário na base fake
    await connection.query(
      'INSERT INTO funcionarios (id,name,cargo,cpf,email,password) VALUES (2,?,?,?,?,?)',
      ['Func Test', 'estoque', '123', func.email, funcHash]
    );

    await request(app)
      .post('/entrar')
      .send(func)
      .expect(302)
      .expect('Location', '/funcionario');
  });
});

describe('Rotas protegidas – autorização', () => {
  it('POST /deletar sem sessão → 302 (redirect para login)', () =>
    request(app).post('/deletar').send({ password: 'x' }).expect(302));
});

describe('Cenários de falha (BD)', () => {
  const casos = [
    { m: 'get',  p: '/buscar-doador?query=teste' },
    { m: 'get',  p: '/buscar-bolsa-sangue?tipo_sangue=O-' },
    { m: 'post', p: '/add-insumo',       body: { nome: 'X', quantidade: 1 } },
    { m: 'get',  p: '/buscar-insumos?nome=X' },
    { m: 'post', p: '/add-bolsa-sangue', body: { tipo_sangue: 'O+', quantidade: 2 } },
    { m: 'post', p: '/recuperar-senha',  body: { email: 'x@y.com' } },
  ];

  it.each(casos)('$m $p – erro no BD devolve 500', async ({ m, p, body }) => {
    jest.spyOn(connection, 'query').mockRejectedValueOnce(new Error('DB Error'));

    const res = body ? await agent[m](p).send(body) : await agent[m](p);
    expect(res.status).toBe(500);
  });
});
